import { createSlice } from "@reduxjs/toolkit";
import {
  fetchConversations,
  fetchUnreadCount,
  fetchMessages,
  sendMessage,
} from "./chatThunks";

const initialState = {
  socketConnected: false,
  conversations: [],           
  convLoading: false,
  messagesByConv: {},           
  activeConversationId: null,  
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSocketConnected(state, action) {
      state.socketConnected = !!action.payload;
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload || null;
    },

    pushLocalMessage(state, action) {
      const { conversationId, content, me, tempId, createdAt } = action.payload;
      if (!conversationId) return;
      const bucket = state.messagesByConv[conversationId] || { items: [] };
      bucket.items = [
        ...bucket.items,
        {
          messageId: tempId,
          content,
          sender: me,
          createdAt: createdAt || new Date().toISOString(),
        },
      ];
      state.messagesByConv[conversationId] = bucket;

      const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
      if (idx >= 0) {
        state.conversations[idx] = {
          ...state.conversations[idx],
          lastMessage: content,
        };
      }
    },

    // Tin nhắn từ server (WS) — realtime
    pushServerMessage(state, action) {
      const m = action.payload;
      const conversationId = m?.conversation?.conversationId || m?.conversationId;
      if (!conversationId) return;

      // append vào bucket
      const bucket = state.messagesByConv[conversationId] || { items: [] };
      bucket.items = [...bucket.items, m];
      state.messagesByConv[conversationId] = bucket;

      // cập nhật lastMessage
      const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
      if (idx >= 0) {
        // nếu chưa có, thêm field lastMessage
        const mine = false;
        const conv = state.conversations[idx];
        const isActive = state.activeConversationId === conversationId;

        state.conversations[idx] = {
          ...conv,
          lastMessage: m.content || "",
          // nếu hội thoại KHÔNG ở màn hình hiện tại và người gửi KHÔNG phải mình → +1 unread
          unread:
            !isActive && m.sender?.userId !== undefined && m.sender?.userId !== (state.meId || "__me__")
              ? (conv.unread || 0) + 1
              : conv.unread || 0,
        };
      }
    },

    // đọc hết (UI vừa mở chat/detail)
    clearUnread(state, action) {
      const conversationId = action.payload;
      const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
      if (idx >= 0) {
        state.conversations[idx] = { ...state.conversations[idx], unread: 0 };
      }
    },

    setLastMessage(state, action) {
      const { conversationId, lastMessage } = action.payload;
      const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
      if (idx >= 0) {
        state.conversations[idx] = { ...state.conversations[idx], lastMessage };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // danh sách hội thoại
      .addCase(fetchConversations.pending, (state) => {
        state.convLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.convLoading = false;
        // chuẩn hoá có unread & lastMessage
        state.conversations = action.payload.map(c => ({
          ...c,
          unread: typeof c.unread === "number" ? c.unread : 0,
          lastMessage: c.lastMessage || "",
        }));
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.convLoading = false;
      })

      // đếm unread
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        const { conversationId, unread } = action.payload || {};
        const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
        if (idx >= 0) {
          state.conversations[idx] = { ...state.conversations[idx], unread: unread ?? 0 };
        }
      })

      // load messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, data } = action.payload;
        const items = (data?.content || data) ?? [];
        state.messagesByConv[conversationId] = { items };
      })

      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { serverMessage } = action.payload || {};
        if (!serverMessage) return;
        const convId = serverMessage?.conversation?.conversationId || serverMessage?.conversationId;
        if (!convId) return;

        const bucket = state.messagesByConv[convId] || { items: [] };
        // append
        bucket.items = [...bucket.items, serverMessage];
        state.messagesByConv[convId] = bucket;

        // cập nhật lastMessage
        const idx = state.conversations.findIndex(c => c.conversationId === convId);
        if (idx >= 0) {
          state.conversations[idx] = {
            ...state.conversations[idx],
            lastMessage: serverMessage.content || "",
          };
        }
      });
  },
});

export const {
  setSocketConnected,
  setActiveConversation,
  pushLocalMessage,
  pushServerMessage,
  clearUnread,
  setLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
