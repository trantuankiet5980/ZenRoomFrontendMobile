import { createSlice } from "@reduxjs/toolkit";
import { fetchProperties, createProperty, fetchPropertyDetail, fetchPropertiesByLandlord, updateProperty, searchProperties } from "./propertiesThunks";



const propertiesSlice = createSlice({
  name: "properties",
  initialState: {
    rooms: [],
    buildings: [],
    landlordRooms: [],   // danh sách riêng cho landlord
    landlordBuildings: [],
    landlordRoomsPending: [],
    landlordBuildingsPending: [],
    searchResults: { content: [], totalElements: 0, totalPages: 0 },
    byId: {},
    current: null,
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
        const propertyId = action.payload?.propertyId;
        if (propertyId !== undefined && propertyId !== null) {
          state.byId[propertyId] = action.payload;
        }
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
        const { type, data, postStatus } = action.payload;

        if (type === "ROOM") {
          if (postStatus === "APPROVED") {
            state.landlordRooms = data;
          } else if (postStatus === "PENDING") {
            state.landlordRoomsPending = data;
          }
        } else if (type === "BUILDING") {
          if (postStatus === "APPROVED") {
            state.landlordBuildings = data;
          } else if (postStatus === "PENDING") {
            state.landlordBuildingsPending = data;
          }
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

        if (updated?.propertyId !== undefined && updated?.propertyId !== null) {
          state.byId[updated.propertyId] = updated;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })


      .addCase(searchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  }
});

export const { resetStatus, resetProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer;
