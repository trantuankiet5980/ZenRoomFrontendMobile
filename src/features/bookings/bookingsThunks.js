import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

// Helper chung
const fetchBookings = async (url, { page = 0, size = 20 } = {}) => {
  const res = await axiosInstance.get(url, { params: { page, size } });
  return res.data;
};

/**
 * Tenant - tạo booking
 */
export const createBooking = createAsyncThunk(
  "bookings/create",
  async ({ propertyId, checkInAt, checkOutAt, note }, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/bookings", {
        propertyId,
        checkInAt,
        checkOutAt,
        note,
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchPropertyBookedDates = createAsyncThunk(
  "bookings/fetchPropertyBookedDates",
  async (propertyId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/bookings/property/${propertyId}/booked-dates`
      );
      return { propertyId, dates: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Tenant - xem danh sách booking
 */
export const fetchMyBookings = createAsyncThunk(
  "bookings/fetchMy",
  async (params, thunkAPI) => {
    try {
      return await fetchBookings("/bookings/me", params);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Tenant - lấy booking pending
 */
export const fetchMyPendingBookings = createAsyncThunk(
  "bookings/fetchMyPending",
  async (params, thunkAPI) => {
    try {
      return await fetchBookings("/bookings/me/pending", params);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Tenant - lấy booking approved
 */
export const fetchMyApprovedBookings = createAsyncThunk(
  "bookings/fetchMyApproved",
  async (params, thunkAPI) => {
    try {
      return await fetchBookings("/bookings/me/approved", params);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Landlord - xem booking cho các phòng
 */
export const fetchLandlordBookings = createAsyncThunk(
  "bookings/fetchLandlord",
  async (params, thunkAPI) => {
    try {
      return await fetchBookings("/bookings/landlord", params);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Landlord - lấy booking pending
 */
export const fetchLandlordPendingBookings = createAsyncThunk(
  "bookings/fetchLandlordPending",
  async (params, thunkAPI) => {
    try {
      return await fetchBookings("/bookings/landlord/pending", params);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Lấy detail 1 booking
 */
export const fetchBookingById = createAsyncThunk(
  "bookings/fetchById",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * Các action của landlord / tenant
 */
export const approveBooking = createAsyncThunk(
  "bookings/approve",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/approve`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const rejectBooking = createAsyncThunk(
  "bookings/reject",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/reject`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "bookings/cancel",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/cancel`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const checkInBooking = createAsyncThunk(
  "bookings/checkIn",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/check-in`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const checkOutBooking = createAsyncThunk(
  "bookings/checkOut",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/check-out`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
/**
 * Tenant - thanh toán booking
 */
export const payBooking = createAsyncThunk(
  "bookings/pay",
  async ({ bookingId, type }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/pay`, { type });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
