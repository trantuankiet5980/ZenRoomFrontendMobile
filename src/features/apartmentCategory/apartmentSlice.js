import { createSlice } from "@reduxjs/toolkit";
import { fetchApartmentCategories } from "./apartmentThunks";

const apartmentSlice = createSlice({
  name: "apartment",
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApartmentCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApartmentCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchApartmentCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default apartmentSlice.reducer;
