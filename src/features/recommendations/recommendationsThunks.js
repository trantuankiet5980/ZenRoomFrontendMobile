import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

const normalizeRecommendationItem = (item) => {
  if (!item) {
    return null;
  }

  const property = item.property || item;
  if (!property) {
    return null;
  }

  const propertyId =
    property.propertyId ?? property.id ?? item.propertyId ?? item.id ?? null;

  if (!propertyId) {
    return null;
  }

  return {
    ...property,
    propertyId,
  };
};

const extractItems = (payload) => {
  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const fetchPersonalRecommendations = createAsyncThunk(
  "recommendations/fetchPersonal",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/recommendations/personal");
      const rawItems = extractItems(response?.data);
      const items = rawItems.map(normalizeRecommendationItem).filter(Boolean);
      return { items };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải gợi ý cá nhân hóa.";
      return rejectWithValue(message);
    }
  }
);

export const fetchAfterSearchRecommendations = createAsyncThunk(
  "recommendations/fetchAfterSearch",
  async ({ query } = {}, { rejectWithValue }) => {
    try {
      if (!query) {
        return { query: "", items: [] };
      }

      const response = await axiosInstance.get(
        "/recommendations/after-search",
        {
          params: { query },
        }
      );

      const rawItems = extractItems(response?.data);
      const items = rawItems.map(normalizeRecommendationItem).filter(Boolean);
      return { query, items };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải gợi ý sau tìm kiếm.";
      return rejectWithValue(message);
    }
  }
);

export const fetchSimilarRecommendations = createAsyncThunk(
  "recommendations/fetchSimilar",
  async ({ roomId } = {}, { rejectWithValue }) => {
    try {
      if (!roomId) {
        return { roomId: null, items: [] };
      }

      const response = await axiosInstance.get("/recommendations/similar", {
        params: { roomId },
      });

      const rawItems = extractItems(response?.data);
      const items = rawItems.map(normalizeRecommendationItem).filter(Boolean);
      return { roomId, items };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải phòng tương tự.";
      return rejectWithValue(message);
    }
  }
);

export const recommendationsThunks = {
  fetchPersonalRecommendations,
  fetchAfterSearchRecommendations,
  fetchSimilarRecommendations,
};

export default recommendationsThunks;