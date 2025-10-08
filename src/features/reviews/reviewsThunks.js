import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

const normalizeReviews = (data) => {
    if (!data) {
        return { reviews: [], total: 0 };
    }

    const { content = [], totalElements = 0 } = data;
    return {
        reviews: Array.isArray(content) ? content : [],
        total: typeof totalElements === "number" ? totalElements : 0,
    };
};

const extractReviewPayload = (data) => {
    if (!data) {
        return null;
    }

    if (data?.data) {
        return data.data;
    }

    if (data?.review) {
        return data.review;
    }

    return data;
};

export const fetchPropertyReviewsSummary = createAsyncThunk(
    "reviews/fetchPropertyReviewsSummary",
    async (propertyId, { rejectWithValue }) => {
        try {
            if (!propertyId) {
                return rejectWithValue("Mã bất động sản không hợp lệ");
            }

            const initialResponse = await axiosInstance.get(
                `/reviews/by-property/${propertyId}`,
                {
                    params: { page: 0, size: 20 },
                }
            );

            const { reviews: initialReviews, total } = normalizeReviews(
                initialResponse.data
            );

            let reviews = initialReviews;

            if (total > initialReviews.length && total > 0) {
                try {
                    const fullResponse = await axiosInstance.get(
                        `/reviews/by-property/${propertyId}`,
                        {
                            params: { page: 0, size: total },
                        }
                    );
                    const { reviews: fullReviews } = normalizeReviews(
                        fullResponse.data
                    );
                    if (fullReviews.length > 0) {
                        reviews = fullReviews;
                    }
                } catch (error) {
                    console.warn(
                        "Không thể tải đầy đủ danh sách đánh giá:",
                        error?.message || error
                    );
                }
            }

            const totalRating = reviews.reduce(
                (sum, item) => sum + (Number(item?.rating) || 0),
                0
            );

            const reviewCount = reviews.length;
            const divisor = reviewCount > 0 ? reviewCount : total;
            const average = divisor > 0 ? totalRating / divisor : 0;

            const normalizedTotal = total > 0 ? total : reviewCount;

            return {
                propertyId,
                summary: {
                    average,
                    total: normalizedTotal,
                },
                reviews,
                total: normalizedTotal,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);



export const createReviewThunk = createAsyncThunk(
    "reviews/createReview",
    async (
        { bookingId, tenantId, propertyId, rating, comment },
        { rejectWithValue }
    ) => {
        try {
            if (!bookingId) {
                return rejectWithValue("Thiếu mã đặt phòng để tạo đánh giá");
            }
            if (!tenantId) {
                return rejectWithValue("Thiếu thông tin người thuê để tạo đánh giá");
            }

            const payload = {
                booking: { bookingId },
                tenantId:
                    tenantId !== undefined && tenantId !== null
                        ? String(tenantId)
                        : tenantId,
                rating,
                comment: comment ?? "",
            };

            const response = await axiosInstance.post("/reviews", payload);
            const review = extractReviewPayload(response?.data);

            return {
                bookingId,
                tenantId,
                propertyId: propertyId || null,
                review: review && typeof review === "object" ? review : null,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);

export const updateReviewThunk = createAsyncThunk(
    "reviews/updateReview",
    async (
        { reviewId, bookingId, propertyId, rating, comment },
        { rejectWithValue }
    ) => {
        try {
            if (!reviewId) {
                return rejectWithValue("Thiếu mã đánh giá để cập nhật");
            }

            const payload = {
                reviewId,
                rating,
                comment: comment ?? "",
            };

            const response = await axiosInstance.post("/reviews", payload);
            const review = extractReviewPayload(response?.data);

            return {
                propertyId: propertyId || null,
                bookingId: bookingId || review?.booking?.bookingId || review?.bookingId || null,
                reviewId,
                review: review && typeof review === "object" ? review : null,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);

export const deleteReviewThunk = createAsyncThunk(
    "reviews/deleteReview",
    async ({ reviewId, propertyId, bookingId }, { rejectWithValue }) => {
        try {
            if (!reviewId) {
                return rejectWithValue("Thiếu mã đánh giá để xóa");
            }

            await axiosInstance.delete(`/reviews/${reviewId}`);
            return {
                propertyId: propertyId || null,
                bookingId: bookingId || null,
                reviewId,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);

export const fetchReviewByBookingThunk = createAsyncThunk(
    "reviews/fetchByBooking",
    async (bookingId, { rejectWithValue }) => {
        try {
            if (!bookingId) {
                return rejectWithValue("Thiếu mã booking");
            }

            const response = await axiosInstance.get(`/reviews/by-booking/${bookingId}`);
            const review = extractReviewPayload(response?.data);

            if (Array.isArray(review)) {
                const firstReview = review[0] || null;
                return {
                    bookingId,
                    review: firstReview && typeof firstReview === "object" ? firstReview : null,
                };
            }

            return {
                bookingId,
                review: review && typeof review === "object" ? review : null,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);

export const submitReviewReplyThunk = createAsyncThunk(
    "reviews/submitReply",
    async ({ reviewId, replyId, replyText }, { rejectWithValue }) => {
        try {
            const trimmedText = typeof replyText === "string" ? replyText.trim() : "";

            if (!trimmedText) {
                return rejectWithValue("Nội dung phản hồi không được để trống");
            }

            const payload = { replyText: trimmedText };

            if (replyId) {
                payload.replyId = replyId;
            } else if (reviewId) {
                payload.reviewId = reviewId;
            } else {
                return rejectWithValue("Thiếu mã đánh giá để phản hồi");
            }

            const response = await axiosInstance.post("/reviews/reply", payload);
            const responseData = response?.data;
            const data =
                (responseData && responseData.data) ||
                responseData?.review ||
                responseData;

            let resolvedReview = null;
            let resolvedReply = null;

            if (data && typeof data === "object") {
                if (data.review && typeof data.review === "object") {
                    resolvedReview = data.review;
                } else if (
                    data.data &&
                    typeof data.data === "object" &&
                    data.data.review &&
                    typeof data.data.review === "object"
                ) {
                    resolvedReview = data.data.review;
                } else if (data.reply && typeof data.reply === "object") {
                    resolvedReply = data.reply;
                } else if (
                    data.reviewId &&
                    (data.rating !== undefined || data.comment !== undefined)
                ) {
                    resolvedReview = data;
                } else if (data.replyId && data.replyText !== undefined) {
                    resolvedReply = data;
                }
            }

            if (resolvedReview && typeof resolvedReview === "object") {
                resolvedReply =
                    resolvedReply ||
                    (resolvedReview.reply && typeof resolvedReview.reply === "object"
                        ? resolvedReview.reply
                        : null) ||
                    (resolvedReview.reviewReply &&
                    typeof resolvedReview.reviewReply === "object"
                        ? resolvedReview.reviewReply
                        : null) ||
                    (resolvedReview.landlordReply &&
                    typeof resolvedReview.landlordReply === "object"
                        ? resolvedReview.landlordReply
                        : null) ||
                    (resolvedReview.replyText !== undefined
                        ? {
                              replyId: resolvedReview.replyId || null,
                              replyText: resolvedReview.replyText,
                              createdAt:
                                  resolvedReview.replyCreatedAt ||
                                  resolvedReview.createdAt ||
                                  null,
                              updatedAt:
                                  resolvedReview.replyUpdatedAt ||
                                  resolvedReview.updatedAt ||
                                  null,
                          }
                        : null);
            }

            const resolvedReviewId =
                (resolvedReview &&
                    (resolvedReview.reviewId ||
                        resolvedReview.id ||
                        resolvedReview.reviewID ||
                        resolvedReview.idReview)) ||
                reviewId ||
                null;

            const resolvedPropertyId = resolvedReview
                ? resolvedReview?.property?.propertyId ||
                  resolvedReview?.propertyId ||
                  resolvedReview?.booking?.property?.propertyId ||
                  resolvedReview?.booking?.propertyId ||
                  null
                : null;

            const resolvedBookingId = resolvedReview
                ? resolvedReview?.booking?.bookingId ||
                  resolvedReview?.bookingId ||
                  null
                : null;

            return {
                reviewId: resolvedReviewId || null,
                propertyId: resolvedPropertyId || null,
                bookingId: resolvedBookingId || null,
                review:
                    resolvedReview && typeof resolvedReview === "object"
                        ? resolvedReview
                        : null,
                reply:
                    resolvedReply && typeof resolvedReply === "object"
                        ? resolvedReply
                        : null,
                replyId:
                    (resolvedReply &&
                        (resolvedReply.replyId ||
                            resolvedReply.id ||
                            resolvedReply.replyID)) ||
                    (resolvedReview && resolvedReview.replyId) ||
                    replyId ||
                    null,
                replyText: trimmedText,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message || error);
        }
    }
);