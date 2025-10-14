import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const addSearchHistory = createAsyncThunk(
  "searchHistory/add",
  async ({ keyword, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/search-history", {
        keyword,
        filters,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSearchHistory = createAsyncThunk(
  "searchHistory/fetch",
  async ({ page = 0, size = 3 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/search-history", {
        params: { page, size },
      });
      return { data: response.data, page, size };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSearchHistory = createAsyncThunk(
  "searchHistory/delete",
  async (searchId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/search-history/${searchId}`);
      return searchId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const clearSearchHistory = createAsyncThunk(
  "searchHistory/clear",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.delete("/search-history/clear");
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRecentKeywords = createAsyncThunk(
  "searchHistory/recentKeywords",
  async (limit = 8, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/search-history/recent-keywords", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);