import { createSlice } from "@reduxjs/toolkit";
import {
    fetchReportReasonsThunk,
    submitPropertyReportThunk,
} from "./reportsThunks";

const initialState = {
    reasons: [],
    reasonsStatus: "idle",
    reasonsError: null,
    submitStatus: "idle",
    submitError: null,
    lastReport: null,
};

const reportsSlice = createSlice({
    name: "reports",
    initialState,
    reducers: {
        resetReportSubmission: (state) => {
            state.submitStatus = "idle";
            state.submitError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReportReasonsThunk.pending, (state) => {
                state.reasonsStatus = "loading";
                state.reasonsError = null;
            })
            .addCase(fetchReportReasonsThunk.fulfilled, (state, action) => {
                state.reasonsStatus = "succeeded";
                state.reasons = action.payload || [];
            })
            .addCase(fetchReportReasonsThunk.rejected, (state, action) => {
                state.reasonsStatus = "failed";
                state.reasonsError = action.payload || action.error?.message || null;
            })
            .addCase(submitPropertyReportThunk.pending, (state) => {
                state.submitStatus = "loading";
                state.submitError = null;
            })
            .addCase(submitPropertyReportThunk.fulfilled, (state, action) => {
                state.submitStatus = "succeeded";
                const payload = action.payload || {};
                state.lastReport = payload?.data || null;
            })
            .addCase(submitPropertyReportThunk.rejected, (state, action) => {
                state.submitStatus = "failed";
                state.submitError = action.payload || action.error?.message || null;
            });
    },
});

export const { resetReportSubmission } = reportsSlice.actions;

export default reportsSlice.reducer;