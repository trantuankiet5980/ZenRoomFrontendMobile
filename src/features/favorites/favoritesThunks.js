import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";


// Thêm phòng vào favorites
export const addFavorite = createAsyncThunk(
    "favorites/addFavorite",
    async (propertyId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/favorites", { propertyId });
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Xoá phòng khỏi favorites
export const removeFavorite = createAsyncThunk(
    "favorites/removeFavorite",
    async (propertyId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/favorites/${propertyId}`);
            return propertyId;
        }
        catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }   
    }
);

// Lấy danh sách favorites
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/favorites");
      // chỉ lấy mảng favorites
      return response.data.favorites;  
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
