import { createSlice } from "@reduxjs/toolkit";
import { fetchProperties } from "./propertiesThunks";

const propertiesSlice = createSlice({
  name: "properties",
  initialState: {
    rooms: [],
    buildings: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        const { type, data } = action.payload;

        if (type === "ROOM") {
          state.rooms = data;
        } else if (type === "BUILDING") {
          state.buildings = data;
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default propertiesSlice.reducer;
