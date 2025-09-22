import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

/** ====================== THUNKS ====================== **/

// 1) Lấy danh sách hội thoại
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/chat/conversations");
      const arr = Array.isArray(data) ? data : [];
      return arr.map(c => ({
        ...c,
        unread: typeof c.unread === "number" ? c.unread : 0,
      }));
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Load conversations failed" });
    }
  }
);

// 2) Lấy unread count
export const fetchUnreadCount = createAsyncThunk(
  "chat/fetchUnreadCount",
  async (conversationId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/chat/conversations/${conversationId}/unread-count`);
      return { conversationId, unread: data?.unread ?? 0 };
    } catch (e) {
      return rejectWithValue({ conversationId, message: "Unread failed" });
    }
  }
);

// 3) Lấy tin nhắn phân trang
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/chat/${conversationId}/messages`, {
        params: { page, size },
      });
      return { conversationId, page, data };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Load messages failed" });
    }
  }
);

// 4) Gửi tin nhắn
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, { content });
      return { conversationId, serverMessage: data };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Send failed" });
    }
  }
);

// 5) Đánh dấu đã đọc hết
export const markReadAll = createAsyncThunk(
  "chat/markReadAll",
  async (conversationId, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/chat/conversations/${conversationId}/read-all`);
      return { conversationId };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Mark read failed" });
    }
  }
);

export const startConversation = createAsyncThunk(
  "chat/startConversation",
  async (propertyId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/chat/conversations/start`,
        null,
        { params: { propertyId } }
      );
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Start conversation failed" });
    }
  }
);