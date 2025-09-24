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

function toPropertyMini(prop) {
  if (!prop) return null;
  return {
    propertyId: prop.propertyId,
    title: prop.title,
    address: prop.address?.addressFull || "",
    price: prop.price,
    thumbnail: (prop.media && prop.media[0]?.url) ? prop.media[0].url : null,
  };
}

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
      const convId = m?.conversation?.conversationId || m?.conversationId;
      if (!convId) return;

      // 1) append message
      const bucket = state.messagesByConv[convId] || { items: [] };
      // chống trùng nếu WS về cùng tin: so sánh messageId
      const exists = bucket.items.some(x => x.messageId === m.messageId);
      if (!exists) {
        bucket.items = [...bucket.items, m];
        state.messagesByConv[convId] = bucket;
      }

      // 2) upsert conversation row (để ChatList & ChatDetail dùng lại)
      const idx = state.conversations.findIndex(c => c.conversationId === convId);
      const propMini = toPropertyMini(m?.conversation?.property);
      const last = m.content || "";

      if (idx >= 0) {
        const conv = state.conversations[idx];
        const isActive = state.activeConversationId === convId;
        const senderId = m?.sender?.userId;

        state.conversations[idx] = {
          ...conv,
          lastMessage: last || conv.lastMessage || "",
          propertyMini: propMini || conv.propertyMini || null,
          unread: !isActive && senderId && senderId !== state.meId
            ? (conv.unread || 0) + 1
            : (conv.unread || 0),
        };
      } else {
        // chưa có trong danh sách (VD: gửi tin từ property lần đầu)
        state.conversations.unshift({
          conversationId: convId,
          tenant: m?.conversation?.tenant || null,
          landlord: m?.conversation?.landlord || null,
          createdAt: m?.conversation?.createdAt || new Date().toISOString(),
          lastMessage: last,
          propertyMini: propMini || null,
          unread: 0,
        });
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
        const mapOld = new Map(state.conversations.map(c => [c.conversationId, c]));
        state.conversations = (action.payload || []).map(c => {
          const old = mapOld.get(c.conversationId);
          return {
            ...c,
            lastMessage: c.lastMessage || old?.lastMessage || "",
            propertyMini: c.propertyMini || old?.propertyMini || null,
            unread: typeof c.unread === "number" ? c.unread : (old?.unread || 0),
          };
        });
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

        const last = items.length ? items[items.length - 1].content : "";
        const idx = state.conversations.findIndex(c => c.conversationId === conversationId);
        if (idx >= 0 && last) {
          state.conversations[idx] = {
            ...state.conversations[idx],
            lastMessage: state.conversations[idx].lastMessage || last,
          };
        }
      })

      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action) => {
        const sm = action.payload?.serverMessage;
        if (!sm) return;
        const convId = sm?.conversation?.conversationId || sm?.conversationId;
        if (!convId) return;

        const bucket = state.messagesByConv[convId] || { items: [] };
        const exists = bucket.items.some(x => x.messageId === sm.messageId);
        if (!exists) {
          bucket.items = [...bucket.items, sm];
          state.messagesByConv[convId] = bucket;
        }

        const idx = state.conversations.findIndex(c => c.conversationId === convId);
        const propMini = toPropertyMini(sm?.conversation?.property);
        if (idx >= 0) {
          state.conversations[idx] = {
            ...state.conversations[idx],
            lastMessage: sm.content || state.conversations[idx].lastMessage || "",
            propertyMini: propMini || state.conversations[idx].propertyMini || null,
          };
        } else {
          state.conversations.unshift({
            conversationId: convId,
            tenant: sm?.conversation?.tenant || null,
            landlord: sm?.conversation?.landlord || null,
            createdAt: sm?.conversation?.createdAt || new Date().toISOString(),
            lastMessage: sm.content || "",
            propertyMini: propMini || null,
            unread: 0,
          });
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
