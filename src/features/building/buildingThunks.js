import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchBuildingRooms = createAsyncThunk(
  "building/fetchRooms",
  async ({ page = 0, size = 20, keyword = "" } = {}) => {
    const response = await axiosInstance.get("/properties", {
      params: {
        type: "BUILDING",
        postStatus: "APPROVED",
        page,
        size,
        q: keyword
      }
    });
    return response.data.content;
  }
);
