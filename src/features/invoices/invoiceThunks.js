import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchInvoiceByBooking = createAsyncThunk(
  "invoices/fetchByBooking",
  async (bookingId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `/invoices/tenant/booking/${bookingId}`
      );
      return { bookingId, invoice: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Không thể tải thông tin thanh toán"
      );
    }
  }
);