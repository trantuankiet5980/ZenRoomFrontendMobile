import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
  async ({ page = 0, size = 20, type,postStatus  }) => {
    const params = { page, size, type,postStatus  };
    const response = await axiosInstance.get("/properties", { params });

    return {
      type,
      data: response.data.content
    };
  }
);

// Đăng phòng mới
export const createProperty = createAsyncThunk(
  "properties/createProperty",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/properties", payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy chi tiết 1 property (room hoặc apartment)
export const fetchPropertyDetail = createAsyncThunk(
  "properties/fetchPropertyDetail",
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/properties/${propertyId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);