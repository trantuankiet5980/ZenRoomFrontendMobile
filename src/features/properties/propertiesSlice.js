import { createSlice } from "@reduxjs/toolkit";
import { fetchProperties, createProperty, fetchPropertyDetail, fetchPropertiesByLandlord,updateProperty } from "./propertiesThunks";



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
    },
    resetProperty(state) {
      state.current = null;
      state.loading = false;
      state.error = null;
    },
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
      .addCase(fetchPropertyDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchPropertyDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPropertiesByLandlord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertiesByLandlord.fulfilled, (state, action) => {
        state.loading = false;
        const { type, data } = action.payload;
        if (type === "ROOM") {
          state.rooms = data;
        } else if (type === "BUILDING") {
          state.buildings = data;
        }
      })
      .addCase(fetchPropertiesByLandlord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Cập nhật vào list rooms/buildings
        const updated = action.payload;
        if (updated.propertyType === "ROOM") {
          state.rooms = state.rooms.map(r => r.propertyId === updated.propertyId ? updated : r);
        } else if (updated.propertyType === "BUILDING") {
          state.buildings = state.buildings.map(b => b.propertyId === updated.propertyId ? updated : b);
        }

        // Cập nhật chi tiết nếu đang mở
        if (state.current?.propertyId === updated.propertyId) {
          state.current = updated;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      ;

  }
});

export const { resetStatus, resetProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer;
