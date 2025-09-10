import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from '../../api/axiosInstance';

export const fetchFurnishings = createAsyncThunk(
  "furnishings/fetchAll",
  async ({ page = 0, size = 50, q = "" }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/furnishings", {
        params: { page, size, q },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
