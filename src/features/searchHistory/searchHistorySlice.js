import { createSlice } from "@reduxjs/toolkit";
import {
  clearSearchHistory,
  deleteSearchHistory,
  fetchRecentKeywords,
  fetchSearchHistory,
} from "./searchHistoryThunks";

const initialState = {
  items: [],
  loading: false,
  moreLoading: false,
  error: null,
  total: 0,
  hasMore: false,
  nextPage: 0,
  recentKeywords: [],
  recentLoading: false,
};

const searchHistorySlice = createSlice({
  name: "searchHistory",
  initialState,
  reducers: {
    resetSearchHistoryState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchHistory.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 0;
        if (page > 0) {
          state.moreLoading = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchSearchHistory.fulfilled, (state, action) => {
        const { data, page } = action.payload;
        const content = Array.isArray(data?.content) ? data.content : [];

        if (page === 0) {
          state.items = content;
        } else {
          const existingIds = new Set(state.items.map((item) => item.searchId));
          content.forEach((item) => {
            if (!existingIds.has(item.searchId)) {
              state.items.push(item);
            }
          });
        }

        state.total = data?.totalElements ?? state.total;
        state.hasMore = data ? !data.last : false;
        state.nextPage = state.hasMore
          ? (typeof data?.number === "number" ? data.number + 1 : page + 1)
          : 0;
        state.loading = false;
        state.moreLoading = false;
      })
      .addCase(fetchSearchHistory.rejected, (state, action) => {
        const page = action.meta.arg?.page ?? 0;
        if (page > 0) {
          state.moreLoading = false;
        } else {
          state.loading = false;
        }
        state.error = action.payload || action.error?.message || "Đã có lỗi xảy ra";
      })
      .addCase(deleteSearchHistory.fulfilled, (state, action) => {
        const searchId = action.payload;
        state.items = state.items.filter((item) => item.searchId !== searchId);
        state.total = Math.max(state.total - 1, 0);
      })
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
        state.hasMore = false;
        state.nextPage = 0;
      })
      .addCase(fetchRecentKeywords.pending, (state) => {
        state.recentLoading = true;
      })
      .addCase(fetchRecentKeywords.fulfilled, (state, action) => {
        state.recentLoading = false;
        state.recentKeywords = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchRecentKeywords.rejected, (state) => {
        state.recentLoading = false;
      });
  },
});

export const { resetSearchHistoryState } = searchHistorySlice.actions;
export default searchHistorySlice.reducer;