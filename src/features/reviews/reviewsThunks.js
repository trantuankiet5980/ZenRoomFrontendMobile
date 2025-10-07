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