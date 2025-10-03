import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from '../../api/axiosInstance';
import { setAuthUser } from '../auth/authSlice';

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/users/profile", userData);
      return res.data; 
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/users/profile');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "user/uploadAvatar",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data || { message: "Upload avatar failed" });
    }
  }
);

// Lấy presigned URL avatar (nếu bucket private)
export const getPresignedAvatar = createAsyncThunk(
  "user/getPresignedAvatar",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/users/me/avatar/presign?minutes=15");
      return res.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data || { message: "Cannot get presigned URL" });
    }
  }
);