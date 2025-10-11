import { createSlice } from "@reduxjs/toolkit";
import { fetchSearchSuggestions, logSearchSuggestionEvent } from "./searchSuggestionsThunks";

const initialState = {
  items: [],
  loading: false,
  error: null,
  query: "",
  lastEvent: null,
};

const searchSuggestionsSlice = createSlice({
  name: "searchSuggestions",
  initialState,
  reducers: {
    clearSearchSuggestions: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.query = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchSuggestions.pending, (state, action) => {
        const query = action.meta?.arg?.query ?? "";
        state.loading = true;
        state.error = null;
        state.query = typeof query === "string" ? query.trim() : "";
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        const { query, data } = action.payload || {};
        if (typeof query === "string" && query.trim() !== state.query.trim()) {
          return;
        }
        state.loading = false;
        state.items = Array.isArray(data) ? data : [];
      })
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        const payloadQuery = action.payload?.query ?? "";
        if (typeof payloadQuery === "string" && payloadQuery.trim() !== state.query.trim()) {
          return;
        }
        state.loading = false;
        state.items = [];
        state.error = action.payload?.message || action.error?.message || null;
      })
      .addCase(logSearchSuggestionEvent.fulfilled, (state, action) => {
        state.lastEvent = action.payload || null;
      });
  },
});

export const { clearSearchSuggestions } = searchSuggestionsSlice.actions;
export default searchSuggestionsSlice.reducer;