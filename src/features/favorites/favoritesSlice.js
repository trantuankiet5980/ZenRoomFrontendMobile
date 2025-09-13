import { createSlice } from "@reduxjs/toolkit";
import { addFavorite, fetchFavorites, removeFavorite } from "./favoritesThunks";

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add favorite
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      // Remove favorite
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (p) => p.propertyId !== action.payload
        );
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
