import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async ({ page = 0, size = 20, keyword = "" } = {}) => {
    const response = await axiosInstance.get("/properties", {
      params: {
        type: "ROOM",
        postStatus: "APPROVED",
        propertyType: "ROOM",
        page,
        size,
        q: keyword
      }
    });
    return response.data.content;
  }
);

// Note: Nếu muốn lấy cả BUILDING và ROOM thì bỏ propertyType
export const fetchBuildingRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async ({ page = 0, size = 20, keyword = "" } = {}) => {
    const response = await axiosInstance.get("/properties", {
      params: {
        type: "BUILDING",
        postStatus: "APPROVED",
        propertyType: "BUILDING",
        page,
        size,
        q: keyword
      }
    });
    return response.data.content;
  }
);
