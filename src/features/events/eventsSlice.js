import { createSlice } from "@reduxjs/toolkit";
import { fetchRecentlyViewed } from "./eventsThunks";

const initialState = {
  recentlyViewed: {
    items: [],
    loading: false,
    error: null,
    page: 0,
    hasMore: true,
    initialLoaded: false,
    lastRequestedPage: 0,
  },
};

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    resetRecentlyViewed: (state) => {
      state.recentlyViewed = { ...initialState.recentlyViewed };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentlyViewed.pending, (state, action) => {
        const page = action.meta?.arg?.page ?? 0;
        state.recentlyViewed.loading = true;
        state.recentlyViewed.error = null;
        state.recentlyViewed.lastRequestedPage = page;
        if (page === 0) {
          state.recentlyViewed.hasMore = true;
        }
      })
      .addCase(fetchRecentlyViewed.fulfilled, (state, action) => {
        const { items, page, hasMore } = action.payload ?? {};
        const target = state.recentlyViewed;
        target.loading = false;
        target.initialLoaded = true;
        target.error = null;
        target.hasMore = Boolean(hasMore);
        target.page = (page ?? 0) + 1;

        if ((page ?? 0) === 0) {
          target.items = Array.isArray(items) ? items : [];
        } else {
          const existingIds = new Set(
            target.items.map((item) => String(item.propertyId))
          );
          (Array.isArray(items) ? items : []).forEach((item) => {
            const propertyId = String(item.propertyId);
            if (!existingIds.has(propertyId)) {
              existingIds.add(propertyId);
              target.items.push(item);
            }
          });
        }
      })
      .addCase(fetchRecentlyViewed.rejected, (state, action) => {
        const target = state.recentlyViewed;
        target.loading = false;
        target.initialLoaded = true;
        target.error = action.payload || action.error?.message || null;
      });
  },
});

export const { resetRecentlyViewed } = eventsSlice.actions;
export default eventsSlice.reducer;