import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
  async ({ page = 0, size = 20, type }) => {
    const params = { page, size, type };
    const response = await axiosInstance.get("/properties", { params });

    return {
      type,
      data: response.data.content
    };
  }
);
