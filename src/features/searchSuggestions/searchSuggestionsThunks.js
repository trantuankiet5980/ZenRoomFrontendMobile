import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

const DEFAULT_SUGGESTION_LIMIT = 10;

export const fetchSearchSuggestions = createAsyncThunk(
  "searchSuggestions/fetch",
  async ({ query, limit = DEFAULT_SUGGESTION_LIMIT } = {}, { rejectWithValue }) => {
    const normalizedQuery = typeof query === "string" ? query.trim() : "";
    if (!normalizedQuery) {
      return { query: "", data: [] };
    }

    try {
      const response = await axiosInstance.get("/search-suggestions", {
        params: { q: normalizedQuery, limit },
      });
      const data = Array.isArray(response?.data) ? response.data : [];
      return { query: normalizedQuery, data };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải gợi ý tìm kiếm.";
      return rejectWithValue({ message, query: normalizedQuery });
    }
  }
);

export const logSearchSuggestionEvent = createAsyncThunk(
  "searchSuggestions/logEvent",
  async ({ type, query, suggestionId } = {}, { rejectWithValue }) => {
    try {
      const payload = { type, query };
      if (suggestionId) {
        payload.suggestionId = suggestionId;
      }
      await axiosInstance.post("/search-suggestions/events", payload);
      return payload;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể ghi lại sự kiện tìm kiếm.";
      return rejectWithValue(message);
    }
  }
);

export const searchSuggestionsThunks = {
  fetchSearchSuggestions,
  logSearchSuggestionEvent,
};

export default searchSuggestionsThunks;