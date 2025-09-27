import { createSlice } from "@reduxjs/toolkit";
import {
  createBooking,
  fetchMyBookings,
  fetchMyPendingBookings,
  fetchMyApprovedBookings,
  fetchLandlordBookings,
  fetchLandlordPendingBookings,
  fetchBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
} from "./bookingsThunks";

const initialState = {
  myBookings: [],
  myPending: [],
  myApproved: [],
  landlordBookings: [],
  landlordPending: [],
  bookingDetail: null,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ==================
      // CREATE BOOKING
      // ==================
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const newBooking = { ...action.payload, status: "PENDING" };
        // thêm vào list myBookings và myPending để hiển thị ngay
        state.myBookings.unshift(newBooking);
        state.myPending.unshift(newBooking);

        // Landlord side
        state.landlordBookings.unshift(newBooking);
        state.landlordPending.unshift(newBooking);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ==================
      // TENANT BOOKINGS
      // ==================
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload?.content || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyPendingBookings.fulfilled, (state, action) => {
        state.myPending = action.payload?.content || [];
      })
      .addCase(fetchMyApprovedBookings.fulfilled, (state, action) => {
        state.myApproved = action.payload?.content || [];
      })

      // ==================
      // LANDLORD BOOKINGS
      // ==================
      .addCase(fetchLandlordBookings.fulfilled, (state, action) => {
        state.landlordBookings = action.payload?.content || [];
      })
      .addCase(fetchLandlordPendingBookings.fulfilled, (state, action) => {
        state.landlordPending = action.payload?.content || [];
      })

      // ==================
      // BOOKING DETAIL
      // ==================
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      })

      // ==================
      // BOOKING ACTIONS
      // ==================
      .addCase(approveBooking.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      })
      .addCase(checkInBooking.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      })
      .addCase(checkOutBooking.fulfilled, (state, action) => {
        state.bookingDetail = action.payload;
      });
  },
});

// Selectors
export const selectMyBookings = (state) => state.bookings.myBookings;
export const selectMyPending = (state) => state.bookings.myPending;
export const selectMyApproved = (state) => state.bookings.myApproved;
export const selectLandlordBookings = (state) => state.bookings.landlordBookings;
export const selectLandlordPending = (state) => state.bookings.landlordPending;
export const selectBookingDetail = (state) => state.bookings.bookingDetail;
export const selectBookingsLoading = (state) => state.bookings.loading;
export const selectBookingsError = (state) => state.bookings.error;

export default bookingSlice.reducer;
