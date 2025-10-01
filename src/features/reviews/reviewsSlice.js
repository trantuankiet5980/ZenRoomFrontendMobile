import { createSlice } from "@reduxjs/toolkit";
import { fetchPropertyReviewsSummary } from "./reviewsThunks";

const initialState = {
    summaries: {},
    lists: {},
    status: {},
    error: {},
};

const reviewsSlice = createSlice({
    name: "reviews",
    initialState,
    reducers: {
        resetReviewsSummary: (state, action) => {
            const propertyId = action.payload;
            if (propertyId) {
                delete state.summaries[propertyId];
                delete state.lists[propertyId];
                delete state.status[propertyId];
                delete state.error[propertyId];
            } else {
                state.summaries = {};
                state.lists = {};
                state.status = {};
                state.error = {};
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPropertyReviewsSummary.pending, (state, action) => {
                const propertyId = action.meta.arg;
                if (propertyId) {
                    state.status[propertyId] = "loading";
                    state.error[propertyId] = null;
                }
            })
            .addCase(fetchPropertyReviewsSummary.fulfilled, (state, action) => {
                const { propertyId, summary, reviews = [], total = 0 } =
                    action.payload || {};
                if (propertyId) {
                    state.summaries[propertyId] = summary || { average: 0, total: 0 };
                    state.lists[propertyId] = {
                        items: Array.isArray(reviews) ? reviews : [],
                        total: typeof total === "number" ? total : reviews.length,
                    };
                    state.status[propertyId] = "succeeded";
                    state.error[propertyId] = null;
                }
            })
            .addCase(fetchPropertyReviewsSummary.rejected, (state, action) => {
                const propertyId = action.meta.arg;
                if (propertyId) {
                    state.status[propertyId] = "failed";
                    state.error[propertyId] = action.payload || action.error?.message || null;
                }
            });
    },
});

export const { resetReviewsSummary } = reviewsSlice.actions;

export default reviewsSlice.reducer;