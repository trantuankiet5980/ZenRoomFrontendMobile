import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchApartmentCategories = createAsyncThunk(
  "apartment/fetchApartmentCategories",
  async () => {
    const response = await axiosInstance.get("/enums/apartment-categories");
    return response.data;
  }
);
