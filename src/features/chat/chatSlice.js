import { createSlice, nanoid } from "@reduxjs/toolkit";
import {
  fetchConversations,
  fetchUnreadCount,
  fetchMessages,
  sendMessage,
  markReadAll,
} from "./chatThunks";

const initialBucket = () => ({
  items: [],
  page: 0,
  size: 20,
  totalPages: 1,
  loading: false,
  error: null,
  hasMore: false,
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    convLoading: false,
    convError: null,

    messagesByConv: {},
    sending: {},
    activeConvId: null,

    search: "",
    tab: "all",
  },
  reducers: {
    setActiveConv(state, { payload }) {
      state.activeConvId = payload || null;
    },
    setSearch(state, { payload }) {
      state.search = payload ?? "";
    },
    setTab(state, { payload }) {
      state.tab = payload || "all";
    },

    pushLocalMessage(state, { payload }) {
      const { conversationId, content, me, tempId } = payload;
      const bucket = state.messagesByConv[conversationId] ||= initialBucket();

      bucket.items = [
        ...bucket.items,
        {
          messageId: tempId,
          content,
          createdAt: new Date().toISOString(),
          sender: me ? { userId: me.userId, fullName: me.fullName } : null,
          isRead: true,
          __temp: true,
        },
      ];
    },


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
      const list = raw.map(m => ({
        ...m,
        sender: m.sender && typeof m.sender === "object"
          ? m.sender
          : { userId: m.senderId }
      }));

      if (page === 0) bucket.items = list;
      else bucket.items = [...list, ...bucket.items];
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
      const bucket = s.messagesByConv[conversationId] ||= initialBucket();

      const idx = bucket.items.findIndex(m => m.__temp);
      if (idx >= 0) {
        bucket.items[idx] = serverMessage;
      } else {
        bucket.items = [...bucket.items, serverMessage];
      }
    });
    b.addCase(sendMessage.rejected, (s, { meta }) => {
      const { conversationId } = meta.arg;
      s.sending[conversationId] = false;
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
  },
});

export const { setActiveConv, setSearch, setTab, pushLocalMessage, replaceTempMessage } =
  chatSlice.actions;

export default chatSlice.reducer;
