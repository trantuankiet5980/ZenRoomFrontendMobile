import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";
import { recordUserEvent } from "../events/eventsThunks";

// Thêm phòng vào favorites
export const addFavorite = createAsyncThunk(
    "favorites/addFavorite",
    async (propertyId, { rejectWithValue, dispatch }) => {
        try {
            const response = await axiosInstance.post("/favorites", { propertyId });
            dispatch(
                recordUserEvent({
                    eventType: "FAVORITE",
                    roomId: propertyId,
                    metadata: { action: "add" },
                })
            );
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Xoá phòng khỏi favorites
export const removeFavorite = createAsyncThunk(
    "favorites/removeFavorite",
    async (propertyId, { rejectWithValue, dispatch }) => {
        try {
            await axiosInstance.delete(`/favorites/${propertyId}`);
            dispatch(
                recordUserEvent({
                    eventType: "FAVORITE",
                    roomId: propertyId,
                    metadata: { action: "remove" },
                })
            );
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

// Xoá tất cả favorites
export const removeAllFavorites = createAsyncThunk(
  "favorites/removeAllFavorites",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await axiosInstance.delete("/favorites");
      dispatch(
        recordUserEvent({
          eventType: "FAVORITE",
          metadata: { action: "remove_all" },
        })
      );
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
