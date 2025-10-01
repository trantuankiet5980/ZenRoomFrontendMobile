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