import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

// Lấy danh sách tỉnh/thành phố
export const fetchProvinces = createAsyncThunk(
  "administrative/fetchProvinces",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/administrative/provinces");
      return response.data.data; // theo ApiResponse { success, message, data }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy danh sách quận/huyện theo tỉnh
export const fetchDistricts = createAsyncThunk(
  "administrative/fetchDistricts",
  async (provinceCode, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/administrative/districts/${provinceCode}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy danh sách phường/xã theo quận/huyện
export const fetchWards = createAsyncThunk(
  "administrative/fetchWards",
  async (districtCode, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/administrative/wards/${districtCode}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
