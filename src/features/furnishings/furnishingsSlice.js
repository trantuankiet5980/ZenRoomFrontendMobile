import { createSlice } from "@reduxjs/toolkit";
import { fetchFurnishings } from "./furnishingsThunks";

const initialState = {
  items: [],    
  total: 0,       
  loading: false,
  error: null,
};

const furnishingsSlice = createSlice({
  name: "furnishings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFurnishings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFurnishings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content || [];
        state.total = action.payload.totalElements || 0;
      })
      .addCase(fetchFurnishings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default furnishingsSlice.reducer;
