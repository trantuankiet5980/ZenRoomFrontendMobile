import { createSlice } from "@reduxjs/toolkit";
import { fetchConversations, fetchMessages, sendMessage, fetchUnreadCount } from "./chatThunks";

const initialState = {
  conversations: [],
  convLoading: false,
  messagesByConv: {}, // { [conversationId]: { items: [] } }
  socketConnected: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    pushLocalMessage(state, action) {
      const { conversationId, content, me, tempId, fullname } = action.payload;
      if (!conversationId) return;
      const bucket = state.messagesByConv[conversationId] || (state.messagesByConv[conversationId] = { items: [] });
      bucket.items.push({
        tempId,
        content,
        createdAt: new Date().toISOString(),
        sender: me,
        fullname,
      });
    },
    pushServerMessage(state, action) {
      const msg = action.payload; // MessageDto từ socket
      const conversationId = msg?.conversation?.conversationId;
      if (!conversationId) return;
      const bucket = state.messagesByConv[conversationId] || (state.messagesByConv[conversationId] = { items: [] });
      if (!bucket.items.find((x) => x.messageId === msg.messageId)) {
        bucket.items.push(msg);
      }
      // có thể cập nhật preview/unread ở conversations tùy ý
    },
    upsertConversationInbox(state, action) {
      const evt = action.payload; // { conversationId, lastMessage, unread, updatedAt }
      const i = state.conversations.findIndex(c => c.conversationId === evt.conversationId);
      if (i >= 0) {
        state.conversations[i].lastMessage = evt.lastMessage;
        state.conversations[i].unread = evt.unread;
        state.conversations[i].updatedAt = evt.updatedAt;
      } else {
        // lần đầu có convo từ socket (chưa load bằng REST)
        state.conversations.unshift({
          conversationId: evt.conversationId,
          unread: evt.unread,
          lastMessage: evt.lastMessage,
          updatedAt: evt.updatedAt,
          // tuỳ bạn: otherParty… nếu muốn nhét thêm trong event
        });
      }
      // sort theo updatedAt nếu muốn
      state.conversations.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    setUnread(state, action) {
      const { conversationId, unread } = action.payload;
      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      if (conv) conv.unread = unread;
    },
    setSocketConnected(state, action) {
      state.socketConnected = !!action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (s) => { s.convLoading = true; })
      .addCase(fetchConversations.fulfilled, (s, { payload }) => {
        s.convLoading = false;
        s.conversations = payload || [];
      })
      .addCase(fetchConversations.rejected, (s) => { s.convLoading = false; })

      .addCase(fetchMessages.fulfilled, (s, { payload }) => {
        const { conversationId, data } = payload;
        const bucket = s.messagesByConv[conversationId] || (s.messagesByConv[conversationId] = { items: [] });
        bucket.items = Array.isArray(data?.content) ? data.content : [];
      })

      .addCase(sendMessage.fulfilled, (s, { payload }) => {
        const msg = payload?.serverMessage;
        const cid = payload?.conversationId;
        if (!cid || !msg) return;
        const bucket = s.messagesByConv[cid] || (s.messagesByConv[cid] = { items: [] });
        if (!bucket.items.find((x) => x.messageId === msg.messageId)) {
          bucket.items.push(msg);
        }
      })

      .addCase(fetchUnreadCount.fulfilled, (s, { payload }) => {
        const { conversationId, unread } = payload || {};
        const conv = s.conversations.find((c) => c.conversationId === conversationId);
        if (conv) conv.unread = unread;
      });
  },
});

export const { pushLocalMessage, pushServerMessage, setUnread, setSocketConnected, upsertConversationInbox } = chatSlice.actions;
export default chatSlice.reducer;
