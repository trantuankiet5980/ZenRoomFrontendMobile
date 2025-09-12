import { createSlice } from "@reduxjs/toolkit";
import { fetchProperties,createProperty } from "./propertiesThunks";



const propertiesSlice = createSlice({
  name: "properties",
  initialState: {
    rooms: [],
    buildings: [],
    loading: false,
    error: null,
    success: false,
  },
   reducers: {
    resetStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
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
      })

       // create
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Tự động push vào list rooms nếu type=ROOM
        if (action.payload.propertyType === "ROOM") {
          state.rooms.push(action.payload);
        } else if (action.payload.propertyType === "BUILDING") {
          state.buildings.push(action.payload);
        }
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.success = false;
      });
  }
});

export const { resetStatus } = propertiesSlice.actions;
export default propertiesSlice.reducer;
