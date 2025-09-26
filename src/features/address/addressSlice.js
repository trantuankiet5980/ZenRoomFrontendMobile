import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAddresses,
  fetchAddressDetail,
  createAddress,
  updateAddress,
  deleteAddress
} from "./addressThunks";

const addressSlice = createSlice({
  name: "address",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetStatus(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    resetAddress(state) {
      state.current = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch detail
      .addCase(fetchAddressDetail.fulfilled, (state, action) => {
        state.current = action.payload;
      })

      // Create
      .addCase(createAddress.fulfilled, (state, action) => {
        state.success = true;
        state.list.push(action.payload);
      })

      // Update
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.success = true;
        state.list = state.list.map(addr =>
          addr.id === action.payload.id ? action.payload : addr
        );
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      })

      // Delete
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.success = true;
        state.list = state.list.filter(addr => addr.id !== action.payload);
      });
  }
});

export const { resetStatus, resetAddress } = addressSlice.actions;
export default addressSlice.reducer;
