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
      const { data } = await axiosInstance.get(`/chat/${conversationId}/unread-count`);
      return { conversationId, unread: data?.unread ?? 0 };
    } catch (e) {
      return rejectWithValue({ conversationId, message: "Unread failed" });
    }
  }
);

// 3) Lấy tin nhắn phân trang mặc định sort ASC theo createAt
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/chat/${conversationId}/messages`, {
        params: { page, size, sort: "createdAt, ASC" },
      });
      return { conversationId, page, data };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Load messages failed" });
    }
  }
);

/**
 * 4) Gửi tin nhắn
 * - Nếu đã có conversationId -> gửi vào conv đó
 * - Nếu CHƯA có conversationId -> kèm peerId hoặc propertyId để server tự tạo conv
 * - Server trả về MessageDto (có conversation.conversationId)
 */
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/chat/send`, payload);
      const cid = data?.conversation?.conversationId;
      return { conversationId: cid, serverMessage: data };
    } catch (e) {
      return rejectWithValue(e?.response?.data || { message: "Send failed" });
    }
  }
)

/**
 * 4b) Gửi tin nhắn kèm hình ảnh (multipart/form-data)
 */
export const sendImages = createAsyncThunk(
  "chat/sendImages",
  async ({ conversationId, propertyId, peerId, content, images }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      if (conversationId) form.append("conversationId", conversationId);
      if (propertyId) form.append("propertyId", propertyId);
      if (peerId) form.append("peerId", peerId);
      if (content) form.append("content", content);

      (images || []).forEach((img, idx) => {
        if (!img?.uri) return;
        const name = img.name || img.fileName || img.filename || `image-${idx}.jpg`;
        const type = img.type || img.mimeType || "image/jpeg";
        form.append("images", {
          uri: img.uri,
          name,
          type,
        });
      });

      const { data } = await axiosInstance.post(`/chat/send/images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cid = data?.conversation?.conversationId;
      return { conversationId: cid, serverMessage: data };
    } catch (e) {
      return rejectWithValue(e?.response?.data || { message: "Send images failed" });
    }
  }
);

// 5) Đánh dấu đã đọc hết
export const markReadAll = createAsyncThunk(
  "chat/markReadAll",
  async (conversationId, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/chat/${conversationId}/read-all`);
      return { conversationId };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Mark read failed" });
    }
  }
);

/** 6) Đánh dấu đã đọc MỘT SỐ message cụ thể (tùy dùng) */
export const markReadSome = createAsyncThunk(
  "chat/markReadSome",
  async ({ conversationId, messageIds }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/chat/${conversationId}/read`, { messageIds });
      return { conversationId, count: data, messageIds };
    } catch (e) {
      return rejectWithValue(e?.response?.data || { message: "Mark read some failed" });
    }
  }
);