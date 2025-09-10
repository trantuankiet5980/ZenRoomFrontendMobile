import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from '../../api/axiosInstance';

export const fetchRoomTypes = createAsyncThunk(
  "roomTypes/fetchRoomTypes",
  async () => {
    const response = await axiosInstance.get("/room-types");
    return response.data;
  }
);