import { createSlice } from "@reduxjs/toolkit";
import {
  fetchConversations,
  fetchUnreadCount,
  fetchMessages,
  sendMessage,
  sendImages,
  deleteConversation,
} from "./chatThunks";

const initialState = {
  socketConnected: false,
  conversations: [],  
  convLoading: false,
  messagesByConv: {},
  activeConversationId: null,
};

const getMessageTimestamp = (message = {}) =>
  message.createdAt || message.updatedAt || new Date().toISOString();

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

function getLastMessagePreview(message) {
  if (!message) return "";
  const content = message.content?.trim();
  if (content) return content;

  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  if (attachments.length > 1) return `Đã gửi ${attachments.length} hình ảnh`;
  if (attachments.length === 1) return "Đã gửi hình ảnh";

  const locals = Array.isArray(message.localImages) ? message.localImages : [];
  if (locals.length > 1) return `Đang gửi ${locals.length} hình ảnh`;
  if (locals.length === 1) return "Đang gửi hình ảnh";

  return "";
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
      const { conversationId, content, me, tempId, createdAt, attachments, localImages } = action.payload;
      if (!conversationId) return;
      const nowIso = createdAt || new Date().toISOString();
      const pendingMessage = {
        messageId: tempId,
        tempId,
        clientRequestId: tempId,
        content,
        sender: me,
        createdAt: nowIso,
        attachments: attachments || [],
        localImages: localImages || [],
        status: "sending",
      };

      const bucket = state.messagesByConv[conversationId] || { items: [] };
      bucket.items = [...bucket.items, pendingMessage];
      state.messagesByConv[conversationId] = bucket;

      const preview =
        getLastMessagePreview({ content, attachments, localImages }) ||
        content ||
        "";

      const idx = state.conversations.findIndex((c) => c.conversationId === conversationId);
      if (idx >= 0) {
        const updated = {
          ...state.conversations[idx],
          lastMessage: preview || state.conversations[idx].lastMessage || "",
          lastMessageAt: nowIso,
        };
        state.conversations.splice(idx, 1);
        state.conversations.unshift(updated);
      } else {
        state.conversations.unshift({
          conversationId,
          tenant: null,
          landlord: null,
          createdAt: nowIso,
          lastMessage: preview,
          propertyMini: null,
          unread: 0,
          lastMessageAt: nowIso,
        });
      }
    },

    // Tin nhắn từ server (WS) — realtime
     pushServerMessage(state, action) {
      const incoming = action.payload || {};
      const { __currentUserId, ...rest } = incoming;
      const m = rest;
      const convId = m?.conversation?.conversationId || m?.conversationId;
      if (!convId) return;

      const currentUserId = __currentUserId || null;

      // 1) append message
      const bucket = state.messagesByConv[convId] || { items: [] };
      const clientRequestId = m?.clientRequestId || m?.tempId || null;
      const normalized = {
        ...m,
        clientRequestId: clientRequestId || undefined,
      };
      if (currentUserId && normalized?.sender?.userId === currentUserId && !normalized.status) {
        normalized.status = normalized.readAt || normalized.read ? "seen" : "sent";
      }
      const existingIdx = clientRequestId
        ? bucket.items.findIndex(
            (x) => x.clientRequestId === clientRequestId || x.tempId === clientRequestId
          )
        : -1;

      if (existingIdx >= 0) {
        bucket.items[existingIdx] = {
          ...bucket.items[existingIdx],
          ...normalized,
          localImages: [],
          status:
            normalized.status ||
            (currentUserId && normalized?.sender?.userId === currentUserId
              ? normalized.readAt || normalized.read
                ? "seen"
                : "sent"
              : bucket.items[existingIdx].status),
        };
      } else {
        const exists = bucket.items.some((x) => x.messageId === normalized.messageId);
        if (!exists) {
          if (
            currentUserId &&
            normalized?.sender?.userId === currentUserId &&
            (normalized.readAt || normalized.read)
          ) {
            normalized.status = "seen";
          }
          bucket.items = [...bucket.items, normalized];
        }
      }
      state.messagesByConv[convId] = bucket;

      // 2) upsert conversation row (để ChatList & ChatDetail dùng lại)
      const idx = state.conversations.findIndex((c) => c.conversationId === convId);
      const propMini = toPropertyMini(m?.conversation?.property);
      const last = getLastMessagePreview(m) || "";
      const messageAt = getMessageTimestamp(m);

      if (idx >= 0) {
        const conv = state.conversations[idx];
        const isActive = state.activeConversationId === convId;
        const senderId = m?.sender?.userId;
        const isMine = currentUserId && senderId === currentUserId;

        const updatedConv = {
          ...conv,
          lastMessage: last || conv.lastMessage || "",
          propertyMini: propMini || conv.propertyMini || null,
          lastMessageAt: messageAt,
          unread:
            !isActive && senderId && !isMine ? (conv.unread || 0) + 1 : conv.unread || 0,
        };
        state.conversations.splice(idx, 1);
        state.conversations.unshift(updatedConv);
      } else {
        // chưa có trong danh sách (VD: gửi tin từ property lần đầu)
        state.conversations.unshift({
          conversationId: convId,
          tenant: m?.conversation?.tenant || null,
          landlord: m?.conversation?.landlord || null,
          createdAt: m?.conversation?.createdAt || new Date().toISOString(),
          lastMessage: last,
          propertyMini: propMini || null,
          unread: currentUserId && m?.sender?.userId === currentUserId ? 0 : 1,
          lastMessageAt: messageAt,
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
        const mapOld = new Map(state.conversations.map((c) => [c.conversationId, c]));
        state.conversations = (action.payload || []).map((c) => {
          const old = mapOld.get(c.conversationId);
          const lastMessageAt =
            c.lastMessageAt ||
            c.lastMessage?.createdAt ||
            c.updatedAt ||
            c.createdAt ||
            old?.lastMessageAt ||
            null;
          return {
            ...c,
            lastMessage: c.lastMessage || old?.lastMessage || "",
            propertyMini: c.propertyMini || old?.propertyMini || null,
            unread: typeof c.unread === "number" ? c.unread : old?.unread || 0,
            lastMessageAt,
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

        const last = items.length ? getLastMessagePreview(items[items.length - 1]) : "";
        const idx = state.conversations.findIndex((c) => c.conversationId === conversationId);
        if (idx >= 0 && last) {
          state.conversations[idx] = {
            ...state.conversations[idx],
            lastMessage: state.conversations[idx].lastMessage || last,
            lastMessageAt:
              state.conversations[idx].lastMessageAt ||
              getMessageTimestamp(items[items.length - 1]) ||
              state.conversations[idx].lastMessageAt,
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
        const clientRequestId = action.meta?.arg?.clientRequestId;
        const normalized = {
          ...sm,
          clientRequestId: clientRequestId || sm.clientRequestId,
        };
        if (clientRequestId) {
          const idxPending = bucket.items.findIndex(
            (x) => x.clientRequestId === clientRequestId || x.tempId === clientRequestId
          );
          if (idxPending >= 0) {
            bucket.items[idxPending] = {
              ...bucket.items[idxPending],
              ...normalized,
              localImages: [],
              status: normalized.readAt || normalized.read ? "seen" : "sent",
            };
          } else if (!bucket.items.some((x) => x.messageId === normalized.messageId)) {
            bucket.items = [...bucket.items, normalized];
          }
        } else if (!bucket.items.some((x) => x.messageId === normalized.messageId)) {
          bucket.items = [...bucket.items, normalized];
        }
        state.messagesByConv[convId] = bucket;

        const idx = state.conversations.findIndex((c) => c.conversationId === convId);
        const propMini = toPropertyMini(sm?.conversation?.property);
        const messageAt = getMessageTimestamp(sm);
        if (idx >= 0) {
          const updated = {
            ...state.conversations[idx],
            lastMessage: getLastMessagePreview(sm) || state.conversations[idx].lastMessage || "",
            propertyMini: propMini || state.conversations[idx].propertyMini || null,
            lastMessageAt: messageAt,
          };
          state.conversations.splice(idx, 1);
          state.conversations.unshift(updated);
        } else {
          state.conversations.unshift({
            conversationId: convId,
            tenant: sm?.conversation?.tenant || null,
            landlord: sm?.conversation?.landlord || null,
            createdAt: sm?.conversation?.createdAt || new Date().toISOString(),
            lastMessage: getLastMessagePreview(sm) || "",
            propertyMini: propMini || null,
            unread: 0,
            lastMessageAt: messageAt,
          });
        }
      })
      .addCase(sendImages.fulfilled, (state, action) => {
        const sm = action.payload?.serverMessage;
        if (!sm) return;
        const convId = sm?.conversation?.conversationId || sm?.conversationId;
        if (!convId) return;

        const bucket = state.messagesByConv[convId] || { items: [] };
        const clientRequestId = action.meta?.arg?.clientRequestId;
        const normalized = {
          ...sm,
          clientRequestId: clientRequestId || sm.clientRequestId,
        };
        if (clientRequestId) {
          const idxPending = bucket.items.findIndex(
            (x) => x.clientRequestId === clientRequestId || x.tempId === clientRequestId
          );
          if (idxPending >= 0) {
            bucket.items[idxPending] = {
              ...bucket.items[idxPending],
              ...normalized,
              localImages: [],
              status: normalized.readAt || normalized.read ? "seen" : "sent",
            };
          } else if (!bucket.items.some((x) => x.messageId === normalized.messageId)) {
            bucket.items = [...bucket.items, normalized];
          }
        } else if (!bucket.items.some((x) => x.messageId === normalized.messageId)) {
          bucket.items = [...bucket.items, normalized];
        }
        state.messagesByConv[convId] = bucket;

        const idx = state.conversations.findIndex((c) => c.conversationId === convId);
        const propMini = toPropertyMini(sm?.conversation?.property);
        const messageAt = getMessageTimestamp(sm);
        if (idx >= 0) {
          const updated = {
            ...state.conversations[idx],
            lastMessage: getLastMessagePreview(sm) || state.conversations[idx].lastMessage || "",
            propertyMini: propMini || state.conversations[idx].propertyMini || null,
            lastMessageAt: messageAt,
          };
          state.conversations.splice(idx, 1);
          state.conversations.unshift(updated);
        } else {
          state.conversations.unshift({
            conversationId: convId,
            tenant: sm?.conversation?.tenant || null,
            landlord: sm?.conversation?.landlord || null,
            createdAt: sm?.conversation?.createdAt || new Date().toISOString(),
            lastMessage: getLastMessagePreview(sm) || "",
            propertyMini: propMini || null,
            unread: 0,
            lastMessageAt: messageAt,
          });
        }
        })

      .addCase(deleteConversation.fulfilled, (state, action) => {
        const resolvedId = action.payload?.conversationId || action.meta?.arg;
        if (!resolvedId) return;
        state.conversations = state.conversations.filter(
          (c) => c.conversationId !== resolvedId
        );
        if (state.messagesByConv[resolvedId]) {
          delete state.messagesByConv[resolvedId];
        }
        if (state.activeConversationId === resolvedId) {
          state.activeConversationId = null;
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
