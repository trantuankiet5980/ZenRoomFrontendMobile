import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

const DEFAULT_RECENTLY_VIEWED_PAGE_SIZE = 7;

const normalizeRecentlyViewedItem = (item) => {
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

const parseHasMore = (payload, items, pageSize) => {
  if (typeof payload?.last === "boolean") {
    return !payload.last;
  }

  if (typeof payload?.hasNext === "boolean") {
    return payload.hasNext;
  }

  if (
    typeof payload?.totalPages === "number" &&
    typeof payload?.number === "number"
  ) {
    return payload.number + 1 < payload.totalPages;
  }

  return items.length >= pageSize;
};

const selectAccessToken = (state) =>
  state?.auth?.token || state?.auth?.accessToken || null;

const buildAuthHeaders = (state) => {
  const token = selectAccessToken(state);
  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchRecentlyViewed = createAsyncThunk(
  "events/fetchRecentlyViewed",
  async (
    { page = 0, limit, size } = {},
    { rejectWithValue, getState }
  ) => {
    try {
      const parsedLimit = Number(limit);
      const parsedSize = Number(size);
      const pageSize = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : Number.isFinite(parsedSize) && parsedSize > 0
        ? parsedSize
        : DEFAULT_RECENTLY_VIEWED_PAGE_SIZE;
      const currentState = typeof getState === "function" ? getState() : null;
      const headers = buildAuthHeaders(currentState);
      const response = await axiosInstance.get("/events/recently-viewed", {
        params: { page, limit: pageSize },
        headers,
      });

      const payload = response?.data ?? {};
      const rawItems = Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const normalizedItems = rawItems
        .map(normalizeRecentlyViewedItem)
        .filter(Boolean);

      return {
        items: normalizedItems,
        page,
        hasMore: parseHasMore(payload, normalizedItems, pageSize),
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải danh sách căn hộ đã xem gần đây.";
      return rejectWithValue(message);
    }
  }
);

export const recordUserEvent = createAsyncThunk(
  "events/recordUserEvent",
  async (
    { eventType, roomId, query, metadata } = {},
    { rejectWithValue }
  ) => {
    try {
      if (!eventType) {
        return rejectWithValue("eventType is required");
      }

      const payload = {
        eventType,
        roomId: roomId || undefined,
        query: query || undefined,
        metadata: metadata || undefined,
      };

      await axiosInstance.post("/events", payload);
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể ghi nhận sự kiện.";
      return rejectWithValue(message);
    }
  }
);

export const eventsThunks = {
  fetchRecentlyViewed,
  recordUserEvent,
};

export default eventsThunks;