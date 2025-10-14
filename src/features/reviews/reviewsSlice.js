import { createSlice } from "@reduxjs/toolkit";
import { 
    fetchPropertyReviewsSummary,
    createReviewThunk,
    updateReviewThunk,
    deleteReviewThunk,
    fetchReviewByBookingThunk,
    submitReviewReplyThunk,
    fetchLandlordReviewStats,
 } from "./reviewsThunks";

const initialState = {
    summaries: {},
    lists: {},
    status: {},
    error: {},
    byBooking: {},
    bookingStatus: {},
    bookingError: {},
    landlordStats: {},
    landlordStatsStatus: {},
    landlordStatsError: {},
    mutations: {
        create: { status: "idle", error: null },
        update: { status: "idle", error: null },
        delete: { status: "idle", error: null },
        reply: { status: "idle", error: null },
    },
};

const calculateAverage = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    const total = items.reduce((sum, item) => sum + (Number(item?.rating) || 0), 0);
    return total / items.length;
};

const getReviewIdentifier = (review) => {
    if (!review) {
        return null;
    }

    const identifier =
        review.reviewId ||
        null;

    return identifier !== null && identifier !== undefined
        ? String(identifier)
        : null;
};

const normalizeReplyPayload = (source, fallbackText = "") => {
    if (!source) {
        if (fallbackText === null || fallbackText === undefined) {
            return null;
        }
        return {
            replyId: null,
            replyText: fallbackText,
            createdAt: null,
            updatedAt: null,
        };
    }

    if (typeof source !== "object") {
        return {
            replyId: null,
            replyText: String(source),
            createdAt: null,
            updatedAt: null,
        };
    }

    const replyId =
        source.replyId ||
        null;
    const replyText =
        source.replyText ||
        source.text ||
        source.content ||
        source.message ||
        source.comment ||
        fallbackText ||
        "";
    const createdAt =
        source.createdAt ||
        null;
    const updatedAt =
        source.updatedAt ||
        null;

    return {
        replyId: replyId || null,
        replyText: replyText !== undefined && replyText !== null ? String(replyText) : "",
        createdAt: createdAt || null,
        updatedAt: updatedAt || null,
    };
};

const mergeReviewWithReply = (review, reply, fallbackText = "") => {
    if (!review) {
        return review;
    }

    const normalizedReply = normalizeReplyPayload(reply, fallbackText);
    if (!normalizedReply) {
        return { ...review };
    }

    const next = { ...review };
    next.reply = normalizedReply;
    next.reviewReply = normalizedReply;
    next.landlordReply = normalizedReply;
    next.replyText = normalizedReply.replyText;
    next.replyId = normalizedReply.replyId || next.replyId || null;
    if (normalizedReply.createdAt !== undefined) {
        next.replyCreatedAt = normalizedReply.createdAt;
    }
    if (normalizedReply.updatedAt !== undefined) {
        next.replyUpdatedAt = normalizedReply.updatedAt;
    }
    return next;
};

const updateReviewInLists = (state, reviewId, updater) => {
    if (!reviewId) {
        return null;
    }

    const reviewKey = String(reviewId);
    const lists = state.lists || {};

    for (const [propertyId, list] of Object.entries(lists)) {
        if (!list || !Array.isArray(list.items)) {
            continue;
        }

        const index = list.items.findIndex(
            (item) => getReviewIdentifier(item) === reviewKey
        );

        if (index !== -1) {
            const updated = updater(list.items[index], propertyId, index);
            if (updated) {
                list.items[index] = updated;
            }
            return {
                propertyId,
                review: list.items[index],
            };
        }
    }

    return null;
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
                state.landlordStats = {};
                state.landlordStatsStatus = {};
                state.landlordStatsError = {};
            }
            state.mutations = {
                create: { status: "idle", error: null },
                update: { status: "idle", error: null },
                delete: { status: "idle", error: null },
                reply: { status: "idle", error: null },
            };
        },
        resetLandlordStats: (state, action) => {
            const landlordId = action.payload;
            if (landlordId) {
                delete state.landlordStats[landlordId];
                delete state.landlordStatsStatus[landlordId];
                delete state.landlordStatsError[landlordId];
            } else {
                state.landlordStats = {};
                state.landlordStatsStatus = {};
                state.landlordStatsError = {};
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
            .addCase(submitReviewReplyThunk.pending, (state) => {
                state.mutations.reply.status = "loading";
                state.mutations.reply.error = null;
            })
            .addCase(submitReviewReplyThunk.fulfilled, (state, action) => {
                state.mutations.reply.status = "succeeded";
                state.mutations.reply.error = null;

                const {
                    reviewId,
                    propertyId,
                    review,
                    reply,
                    replyText,
                    bookingId,
                } = action.payload || {};

                const resolvedReviewId =
                    getReviewIdentifier(review) ||
                    (reviewId !== undefined && reviewId !== null
                        ? String(reviewId)
                        : null);

                const replySource =
                    reply ||
                    (review &&
                        (review.reply ||
                            review.reviewReply ||
                            review.landlordReply)) ||
                    null;

                const fallbackText =
                    (replySource && replySource.replyText) ||
                    (review && review.replyText) ||
                    replyText ||
                    "";

                const applyUpdate = (currentReview = null) => {
                    const mergedBase = {
                        ...(currentReview || {}),
                        ...(review && typeof review === "object" ? review : {}),
                    };

                    const currentReply =
                        replySource ||
                        mergedBase.reply ||
                        mergedBase.reviewReply ||
                        mergedBase.landlordReply ||
                        null;

                    const resolvedFallback =
                        fallbackText || mergedBase.replyText || "";

                    return mergeReviewWithReply(
                        mergedBase,
                        currentReply,
                        resolvedFallback
                    );
                };

                let resolvedPropertyId =
                    propertyId ||
                    (review &&
                        (review.property?.propertyId ||
                            review.propertyId ||
                            review.booking?.property?.propertyId ||
                            review.booking?.propertyId ||
                            null)) ||
                    null;

                let updatedReview = null;

                if (
                    resolvedPropertyId &&
                    state.lists[resolvedPropertyId] &&
                    Array.isArray(state.lists[resolvedPropertyId].items)
                ) {
                    const list = state.lists[resolvedPropertyId];
                    const index = list.items.findIndex(
                        (item) => getReviewIdentifier(item) === resolvedReviewId
                    );
                    if (index !== -1) {
                        list.items[index] = applyUpdate(list.items[index]);
                        updatedReview = list.items[index];
                    }
                }

                if (!updatedReview) {
                    const lookupId =
                        resolvedReviewId || getReviewIdentifier(review);
                    if (lookupId) {
                        const result = updateReviewInLists(
                            state,
                            lookupId,
                            (current, propertyKey) => {
                                resolvedPropertyId =
                                    resolvedPropertyId || propertyKey;
                                return applyUpdate(current);
                            }
                        );
                        if (result) {
                            updatedReview = result.review;
                        }
                    }
                }

                const resolvedBookingId =
                    bookingId ||
                    (review &&
                        (review.booking?.bookingId || review.bookingId || null)) ||
                    (updatedReview &&
                        (updatedReview.booking?.bookingId ||
                            updatedReview.bookingId ||
                            null)) ||
                    null;

                if (resolvedBookingId) {
                    const baseBookingReview =
                        (review && typeof review === "object" ? review : null) ||
                        state.byBooking[resolvedBookingId] ||
                        updatedReview ||
                        null;

                    if (baseBookingReview) {
                        state.byBooking[resolvedBookingId] = applyUpdate(
                            baseBookingReview
                        );
                        state.bookingStatus[resolvedBookingId] = "succeeded";
                        state.bookingError[resolvedBookingId] = null;
                    }
                }
            })
            .addCase(submitReviewReplyThunk.rejected, (state, action) => {
                state.mutations.reply.status = "failed";
                state.mutations.reply.error =
                    action.payload || action.error?.message || null;
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
            })
            .addCase(fetchLandlordReviewStats.pending, (state, action) => {
                const landlordId = action.meta.arg;
                if (landlordId) {
                    state.landlordStatsStatus[landlordId] = "loading";
                    state.landlordStatsError[landlordId] = null;
                    state.landlordStats[landlordId] = { totalReviews: 0, averageRating: 0 };
                }
            })
            .addCase(fetchLandlordReviewStats.fulfilled, (state, action) => {
                const { landlordId, stats } = action.payload || {};
                if (landlordId) {
                    state.landlordStats[landlordId] = {
                        totalReviews: stats?.totalReviews || 0,
                        averageRating: stats?.averageRating || 0,
                    };
                    state.landlordStatsStatus[landlordId] = "succeeded";
                    state.landlordStatsError[landlordId] = null;
                }
            })
            .addCase(fetchLandlordReviewStats.rejected, (state, action) => {
                const landlordId = action.meta.arg;
                if (landlordId) {
                    state.landlordStatsStatus[landlordId] = "failed";
                    state.landlordStatsError[landlordId] = action.payload || action.error?.message || null;
                }
            });
    },
});

export const { 
    resetReviewsSummary, 
    upsertBookingReview,
    resetLandlordStats
 } = reviewsSlice.actions;

export default reviewsSlice.reducer;