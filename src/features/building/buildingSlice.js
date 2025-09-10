import { createSlice } from "@reduxjs/toolkit";
import { fetchBuildingRooms } from "./buildingThunks";

const buildingSlice = createSlice({
  name: "building",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchBuildingRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuildingRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBuildingRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default buildingSlice.reducer;
