import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

/** ====================== THUNKS ====================== **/

// 1) Lấy danh sách hội thoại
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/chat/conversations");
      const arr = Array.isArray(data) ? data : [];
      // Chuẩn hoá + gắn unread tạm = 0 (sẽ gọi fetchUnreadCount để cập nhật)
      return arr.map(c => ({
        ...c,
        unread: typeof c.unread === "number" ? c.unread : 0,
      }));
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Load conversations failed" });
    }
  }
);

// 2) Lấy unread của 1 hội thoại
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

// 3) Lấy tin nhắn phân trang (mặc định page=0,size=20)
//    Backend đang trả theo createdAt ASC (cũ -> mới). Ta sẽ giữ nguyên thứ tự ASC trong store.
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

// 4) Gửi tin nhắn (kèm optimistic UI)
//    Truyền thêm 'me' (user hiện tại) để tạo message local trong pending.
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

/** ====================== SLICE ====================== **/

const initialBucket = () => ({
  items: [],           // mảng message ASC (cũ -> mới)
  page: 0,
  size: 20,
  totalPages: 1,
  loading: false,
  error: null,
  hasMore: false,      // còn trang cũ hơn không
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],       // [{conversationId, tenant, landlord, property, createdAt, unread}]
    convLoading: false,
    convError: null,

    messagesByConv: {},      // { [conversationId]: bucket }
    sending: {},             // { [conversationId]: boolean }
    activeConvId: null,

    search: "",
    tab: "all",              // 'all' | 'tenant'
  },
  reducers: {
    setActiveConv(state, { payload }) { state.activeConvId = payload || null; },
    setSearch(state, { payload }) { state.search = payload ?? ""; },
    setTab(state, { payload }) { state.tab = payload || "all"; },

    // Tạo tin nhắn local (optimistic) — gọi ngay trước khi dispatch(sendMessage)
    pushLocalMessage(state, { payload }) {
      const { conversationId, content, me } = payload;
      const bucket = state.messagesByConv[conversationId] ||= initialBucket();

      const tempId = `local-${nanoid()}`;
      bucket.items = [
        ...bucket.items,
        {
          messageId: tempId,
          content,
          createdAt: new Date().toISOString(),
          sender: me ?? null,
          isRead: true,
          __temp: true,
        },
      ];
    },

    // Nếu muốn replace theo tempId riêng thì dùng reducer này
    replaceTempMessage(state, { payload }) {
      const { conversationId, tempId, serverMessage } = payload;
      const bucket = state.messagesByConv[conversationId];
      if (!bucket) return;
      const i = bucket.items.findIndex(m => m.messageId === tempId);
      if (i >= 0) bucket.items[i] = serverMessage;
      else bucket.items = [...bucket.items, serverMessage];
    },
  },
  extraReducers: (b) => {
    /** Conversations */
    b.addCase(fetchConversations.pending, (s) => {
      s.convLoading = true; s.convError = null;
    });
    b.addCase(fetchConversations.fulfilled, (s, { payload }) => {
      s.convLoading = false;
      s.conversations = payload;
    });
    b.addCase(fetchConversations.rejected, (s, { payload }) => {
      s.convLoading = false;
      s.convError = payload?.message || "Load conversations failed";
    });

    /** Unread */
    b.addCase(fetchUnreadCount.fulfilled, (s, { payload }) => {
      const { conversationId, unread } = payload;
      const c = s.conversations.find(x => x.conversationId === conversationId);
      if (c) c.unread = unread;
    });

    /** Messages */
    b.addCase(fetchMessages.pending, (s, { meta }) => {
      const { conversationId } = meta.arg;
      const bucket = s.messagesByConv[conversationId] ||= initialBucket();
      bucket.loading = true; bucket.error = null;
    });
    b.addCase(fetchMessages.fulfilled, (s, { payload }) => {
      const { conversationId, page, data } = payload;
      const bucket = s.messagesByConv[conversationId] ||= initialBucket();
      bucket.loading = false;
      bucket.page = data.number;
      bucket.size = data.size;
      bucket.totalPages = data.totalPages;
      bucket.hasMore = !data.last;

      const raw = Array.isArray(data.content) ? data.content : [];
      const list = raw.map(m => {
        let sender = m.sender;
        if (sender && typeof sender !== 'object') {
            if (m.senderId) sender = { userId: m.senderId };
        }
        const { conversation, ...rest } = m;
        return { ...rest, sender };
        });

      // Giữ thứ tự ASC (cũ -> mới). Backend đã trả ASC sẵn => ta merge như sau:
      if (page === 0) {
        bucket.items = list;
      } else {
        // page>0 là tải thêm tin nhắn cũ hơn -> prepend vào đầu
        bucket.items = [...list, ...bucket.items];
      }
    });
    b.addCase(fetchMessages.rejected, (s, { meta, payload }) => {
      const { conversationId } = meta.arg;
      const bucket = s.messagesByConv[conversationId] ||= initialBucket();
      bucket.loading = false;
      bucket.error = payload?.message || "Load messages failed";
    });

    /** Send */
    b.addCase(sendMessage.pending, (s, { meta }) => {
      const { conversationId } = meta.arg;
      s.sending[conversationId] = true;
    });
    b.addCase(sendMessage.fulfilled, (s, { payload }) => {
      const { conversationId, serverMessage } = payload;
      s.sending[conversationId] = false;
      const bucket = s.messagesByConv[conversationId] ||= initialBucket();

      let idx = -1;
      for (let i = bucket.items.length - 1; i >= 0; i--) {
        if (bucket.items[i].__temp) { idx = i; break; }
      }
      if (idx >= 0) {
        const tempMsg = bucket.items[idx];
        const merged = {
            ...serverMessage,
            sender: (serverMessage?.sender && typeof serverMessage.sender === 'object')
                ? serverMessage.sender
                : (tempMsg?.sender ?? serverMessage.sender),
        };
        bucket.items = [
            ...bucket.items.slice(0, idx),
            merged,
            ...bucket.items.slice(idx + 1),
        ];
      } else {
        bucket.items = [...bucket.items, serverMessage];
      }

      // giảm unread của hội thoại đó cho phía mình (không bắt buộc)
      const conv = s.conversations.find(c => c.conversationId === conversationId);
      if (conv) conv.unread = 0;
    });
    b.addCase(sendMessage.rejected, (s, { meta }) => {
      const { conversationId } = meta.arg;
      s.sending[conversationId] = false;
      // Không xoá local để user thấy lỗi; tuỳ bạn có thể rollback local message ở UI
    });

    /** Read all */
    b.addCase(markReadAll.fulfilled, (s, { payload }) => {
      const { conversationId } = payload;
      const conv = s.conversations.find(c => c.conversationId === conversationId);
      if (conv) conv.unread = 0;

      const bucket = s.messagesByConv[conversationId];
      if (bucket) {
        bucket.items = bucket.items.map(m => ({ ...m, isRead: true }));
        }
    });
    }
});

export const {
  setActiveConv, setSearch, setTab,
  pushLocalMessage, replaceTempMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
