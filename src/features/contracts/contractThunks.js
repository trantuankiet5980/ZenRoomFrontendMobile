import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

// Lấy hợp đồng theo bookingId
export const fetchContractByBooking = createAsyncThunk(
  "contracts/fetchByBooking",
  async (bookingId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/contracts/by-booking/${bookingId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy hợp đồng theo contractId
export const fetchContractById = createAsyncThunk(
  "contracts/fetchById",
  async (contractId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/contracts/${contractId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Tạo hợp đồng mới
export const createContract = createAsyncThunk(
  "contracts/create",
  async (payload, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/contracts", payload);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Cập nhật hợp đồng
export const updateContract = createAsyncThunk(
  "contracts/update",
  async ({ contractId, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/contracts/${contractId}`, data);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Xóa hợp đồng
export const deleteContract = createAsyncThunk(
  "contracts/delete",
  async (contractId, thunkAPI) => {
    try {
      await axiosInstance.delete(`/contracts/${contractId}`);
      return contractId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
