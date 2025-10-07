import { createSlice } from "@reduxjs/toolkit";
import { 
    fetchPropertyReviewsSummary,
    createReviewThunk,
    updateReviewThunk,
    deleteReviewThunk,
    fetchReviewByBookingThunk,
 } from "./reviewsThunks";

const initialState = {
    summaries: {},
    lists: {},
    status: {},
    error: {},
    byBooking: {},
    bookingStatus: {},
    bookingError: {},
    mutations: {
        create: { status: "idle", error: null },
        update: { status: "idle", error: null },
        delete: { status: "idle", error: null },
    },
};

const calculateAverage = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    const total = items.reduce((sum, item) => sum + (Number(item?.rating) || 0), 0);
    return total / items.length;
};

const reviewsSlice = createSlice({
    name: "reviews",
    initialState,
    reducers: {
        upsertBookingReview: (state, action) => {
            const { bookingId, review } = action.payload || {};
            if (!bookingId || !review) {
                return;
            }

            state.byBooking[bookingId] = review;
            state.bookingStatus[bookingId] = "succeeded";
            state.bookingError[bookingId] = null;
        },
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
            state.mutations = {
                create: { status: "idle", error: null },
                update: { status: "idle", error: null },
                delete: { status: "idle", error: null },
            };
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
                    if (Array.isArray(reviews)) {
                        reviews.forEach((item) => {
                            const bookingId =
                                item?.booking?.bookingId ||
                                item?.bookingId ||
                                item?.booking?.id ||
                                null;
                            if (bookingId) {
                                state.byBooking[bookingId] = item;
                                state.bookingStatus[bookingId] = "succeeded";
                                state.bookingError[bookingId] = null;
                            }
                        });
                    }
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
            })
            .addCase(createReviewThunk.pending, (state) => {
                state.mutations.create.status = "loading";
                state.mutations.create.error = null;
            })
            .addCase(createReviewThunk.fulfilled, (state, action) => {
                state.mutations.create.status = "succeeded";
                state.mutations.create.error = null;
                const { propertyId, review, bookingId } = action.payload || {};
                if (propertyId && review && typeof review === "object") {
                    const list = state.lists[propertyId];
                    if (!list) {
                        state.lists[propertyId] = { items: [review], total: 1 };
                    } else {
                        const existingIndex = Array.isArray(list.items)
                            ? list.items.findIndex(
                                  (item) => item?.reviewId && review?.reviewId
                                      ? `${item.reviewId}` === `${review.reviewId}`
                                      : false
                              )
                            : -1;
                        if (existingIndex >= 0) {
                            list.items[existingIndex] = review;
                        } else if (Array.isArray(list.items)) {
                            list.items.unshift(review);
                        } else {
                            list.items = [review];
                        }
                        list.total = Array.isArray(list.items) ? list.items.length : 0;
                    }
                    const summary = state.summaries[propertyId];
                    if (summary && state.lists[propertyId]?.items) {
                        summary.total = state.lists[propertyId].items.length;
                        summary.average = calculateAverage(state.lists[propertyId].items);
                    }
                }
                if (bookingId) {
                    state.byBooking[bookingId] = review;
                    state.bookingStatus[bookingId] = "succeeded";
                    state.bookingError[bookingId] = null;
                }
            })
            .addCase(createReviewThunk.rejected, (state, action) => {
                state.mutations.create.status = "failed";
                state.mutations.create.error = action.payload || action.error?.message || null;
            })
            .addCase(updateReviewThunk.pending, (state) => {
                state.mutations.update.status = "loading";
                state.mutations.update.error = null;
            })
            .addCase(updateReviewThunk.fulfilled, (state, action) => {
                state.mutations.update.status = "succeeded";
                state.mutations.update.error = null;
                const { propertyId, review, bookingId } = action.payload || {};
                if (propertyId && review && typeof review === "object") {
                    const list = state.lists[propertyId];
                    if (list && Array.isArray(list.items)) {
                        const index = list.items.findIndex((item) => {
                            if (!item?.reviewId || !review?.reviewId) {
                                return false;
                            }
                            return `${item.reviewId}` === `${review.reviewId}`;
                        });
                        if (index >= 0) {
                            list.items[index] = review;
                        }
                        list.total = list.items.length;
                    }
                    const summary = state.summaries[propertyId];
                    if (summary && list?.items) {
                        summary.average = calculateAverage(list.items);
                        summary.total = list.items.length;
                    }
                }
                const resolvedBookingId =
                    bookingId || review?.booking?.bookingId || review?.bookingId || null;
                if (resolvedBookingId) {
                    state.byBooking[resolvedBookingId] = review;
                    state.bookingStatus[resolvedBookingId] = "succeeded";
                    state.bookingError[resolvedBookingId] = null;
                }
            })
            .addCase(updateReviewThunk.rejected, (state, action) => {
                state.mutations.update.status = "failed";
                state.mutations.update.error = action.payload || action.error?.message || null;
            })
            .addCase(deleteReviewThunk.pending, (state) => {
                state.mutations.delete.status = "loading";
                state.mutations.delete.error = null;
            })
            .addCase(deleteReviewThunk.fulfilled, (state, action) => {
                state.mutations.delete.status = "succeeded";
                state.mutations.delete.error = null;
                const { propertyId, reviewId, bookingId } = action.payload || {};
                if (propertyId && reviewId) {
                    const list = state.lists[propertyId];
                    if (list && Array.isArray(list.items)) {
                        list.items = list.items.filter((item) => {
                            if (!item?.reviewId) {
                                return true;
                            }
                            return `${item.reviewId}` !== `${reviewId}`;
                        });
                        list.total = list.items.length;
                    }
                    const summary = state.summaries[propertyId];
                    if (summary && list?.items) {
                        summary.total = list.items.length;
                        summary.average = calculateAverage(list.items);
                    }
                }
                const resolvedBookingId = bookingId || null;
                if (resolvedBookingId) {
                    delete state.byBooking[resolvedBookingId];
                    delete state.bookingStatus[resolvedBookingId];
                    delete state.bookingError[resolvedBookingId];
                }
            })
            .addCase(deleteReviewThunk.rejected, (state, action) => {
                state.mutations.delete.status = "failed";
                state.mutations.delete.error = action.payload || action.error?.message || null;
            })
            .addCase(fetchReviewByBookingThunk.pending, (state, action) => {
                const bookingId = action.meta.arg;
                if (!bookingId) {
                    return;
                }
                state.bookingStatus[bookingId] = "loading";
                state.bookingError[bookingId] = null;
            })
            .addCase(fetchReviewByBookingThunk.fulfilled, (state, action) => {
                const { bookingId, review } = action.payload || {};
                if (!bookingId) {
                    return;
                }
                if (review && typeof review === "object") {
                    state.byBooking[bookingId] = review;
                    state.bookingStatus[bookingId] = "succeeded";
                    state.bookingError[bookingId] = null;
                    const propertyId =
                        review?.property?.propertyId ||
                        review?.propertyId ||
                        review?.booking?.property?.propertyId ||
                        review?.booking?.propertyId ||
                        null;
                    if (propertyId && state.lists[propertyId]?.items) {
                        const list = state.lists[propertyId];
                        const index = list.items.findIndex((item) => {
                            if (!item?.reviewId || !review?.reviewId) {
                                return false;
                            }
                            return `${item.reviewId}` === `${review.reviewId}`;
                        });
                        if (index >= 0) {
                            list.items[index] = review;
                        } else {
                            list.items.unshift(review);
                        }
                        list.total = list.items.length;
                        const summary = state.summaries[propertyId];
                        if (summary && list.items) {
                            summary.total = list.items.length;
                            summary.average = calculateAverage(list.items);
                        }
                    }
                } else {
                    delete state.byBooking[bookingId];
                    state.bookingStatus[bookingId] = "succeeded";
                    state.bookingError[bookingId] = null;
                }
            })
            .addCase(fetchReviewByBookingThunk.rejected, (state, action) => {
                const bookingId = action.meta.arg;
                if (!bookingId) {
                    return;
                }
                state.bookingStatus[bookingId] = "failed";
                state.bookingError[bookingId] = action.payload || action.error?.message || null;
            });
    },
});

export const { resetReviewsSummary, upsertBookingReview } = reviewsSlice.actions;

export default reviewsSlice.reducer;