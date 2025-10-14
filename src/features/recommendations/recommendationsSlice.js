import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAfterSearchRecommendations,
  fetchPersonalRecommendations,
  fetchSimilarRecommendations,
} from "./recommendationsThunks";

const initialState = {
  personal: {
    items: [],
    loading: false,
    error: null,
    loaded: false,
  },
  afterSearch: {
    query: "",
    items: [],
    loading: false,
    error: null,
  },
  similar: {
    roomId: null,
    items: [],
    loading: false,
    error: null,
  },
};

const recommendationsSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    clearAfterSearchRecommendations: (state) => {
      state.afterSearch = { ...initialState.afterSearch };
    },
    clearSimilarRecommendations: (state) => {
      state.similar = { ...initialState.similar };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalRecommendations.pending, (state) => {
        state.personal.loading = true;
        state.personal.error = null;
      })
      .addCase(fetchPersonalRecommendations.fulfilled, (state, action) => {
        state.personal.loading = false;
        state.personal.error = null;
        state.personal.loaded = true;
        state.personal.items = action.payload?.items || [];
      })
      .addCase(fetchPersonalRecommendations.rejected, (state, action) => {
        state.personal.loading = false;
        state.personal.loaded = true;
        state.personal.error = action.payload || action.error?.message || null;
      })
      .addCase(fetchAfterSearchRecommendations.pending, (state, action) => {
        state.afterSearch.loading = true;
        state.afterSearch.error = null;
        state.afterSearch.query = action.meta?.arg?.query || "";
      })
      .addCase(fetchAfterSearchRecommendations.fulfilled, (state, action) => {
        state.afterSearch.loading = false;
        state.afterSearch.error = null;
        state.afterSearch.query = action.payload?.query || "";
        state.afterSearch.items = action.payload?.items || [];
      })
      .addCase(fetchAfterSearchRecommendations.rejected, (state, action) => {
        state.afterSearch.loading = false;
        state.afterSearch.error = action.payload || action.error?.message || null;
      })
      .addCase(fetchSimilarRecommendations.pending, (state, action) => {
        state.similar.loading = true;
        state.similar.error = null;
        state.similar.roomId = action.meta?.arg?.roomId || null;
      })
      .addCase(fetchSimilarRecommendations.fulfilled, (state, action) => {
        state.similar.loading = false;
        state.similar.error = null;
        state.similar.roomId = action.payload?.roomId || null;
        state.similar.items = action.payload?.items || [];
      })
      .addCase(fetchSimilarRecommendations.rejected, (state, action) => {
        state.similar.loading = false;
        state.similar.error = action.payload || action.error?.message || null;
      });
  },
});

export const {
  clearAfterSearchRecommendations,
  clearSimilarRecommendations,
} = recommendationsSlice.actions;

export default recommendationsSlice.reducer;