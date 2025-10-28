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

// Xem danh sách hóa đơn của tenant (phân trang)
export const fetchTenantInvoices = createAsyncThunk(
  "invoices/fetchTenantInvoices",
  async ({ page = 0, size = 20 } = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/invoices/tenant`, {
        params: { page, size },
      });

      return res.data.content || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// Xem chi tiết hóa đơn cụ thể
export const fetchTenantInvoiceDetail = createAsyncThunk(
  "invoices/fetchDetail",
  async (invoiceId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.userId || ""; 
      const res = await axiosInstance.get(`/invoices/tenant/${invoiceId}`, {
        headers: { "X-User-Id": userId },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn");
    }
  }
);

// Xem danh sách hóa đơn của landlord (phân trang)
export const fetchLandlordInvoices = createAsyncThunk(
  "invoices/fetchLandlordInvoices",
  async ({ page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/invoices/landlord", {
        params: { page, size },
      });
      return {
        content: res.data.content || [],
        page: res.data.number,
        size: res.data.size,
        totalElements: res.data.totalElements,
        totalPages: res.data.totalPages,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Không thể tải hóa đơn");
    }
  }
);

// Xem chi tiết hóa đơn cụ thể của landlord
export const fetchLandlordInvoiceDetail = createAsyncThunk(
  "invoices/fetchLandlordInvoiceDetail",
  async (invoiceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/invoices/landlord/${invoiceId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải chi tiết hóa đơn"
      );
    }
  }
);