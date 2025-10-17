import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import { store } from '../app/store';
import { wsConnected, wsDisconnected, wsUpsert } from '../features/notifications/notificationsSlice';
import { showToast } from '../utils/AppUtils';
import { getWsUrl } from '../utils/wsUrl';

let client = null;
let currentRole = null;
let currentUserId = null;

function safeLower(x) {
  return String(x || '').toLowerCase();
}

function subscribeTopic(destination) {
  if (!client || !destination) return;
  try {
    client.subscribe(destination, handleMessage);
    console.log('[WS] SUB', destination);
  } catch (err) {
    console.warn('[WS] SUB ERROR', destination, err?.message || err);
  }
}

function handleMessage(message) {
  try {
    console.log('[WS] MESSAGE frame', {
      command: message?.command,
      headers: message?.headers,
      body: message?.body,
    });

    if (!message?.body) return;

    const body = JSON.parse(message.body);
    console.log('[WS] message parsed', body);
    
    store.dispatch(wsUpsert(body));

    const item      = Array.isArray(body) ? body[0] : body;
    const type      = item?.type;
    const title     = item?.title || 'Thông báo';
    const messageTx = item?.message?.trim();
    const status    = safeLower(item?.status);
    const reason    = item?.rejectedReason ? ` (Lý do: ${item.rejectedReason})` : '';

    let toastBody = messageTx;

    if (!toastBody) {
      if (type === 'PROPERTY_STATUS_CHANGED') {
        const human = status === 'approved' ? 'đã được DUYỆT'
                    : status === 'rejected' ? 'BỊ TỪ CHỐI'
                    : 'đang CHỜ DUYỆT';
        toastBody = `🔔 "${title}" ${human}${reason}`;
      } else {
        toastBody = `🔔 ${title}`;
      }
    }
    showToast('info', 'top', title, toastBody);
  } catch (_) {}
}

function buildUserTopics(userId) {
  const id = String(userId || '').trim();
  if (!id) return [];
  return [
    `/topic/notify.${id}`,
    `/topic/users/${id}/notifications`,
    `/topic/user.notifications.${id}`,
    `/topic/notifications/${id}`,
  ];
}

export async function connectNotificationsSocket(role /* admin|landlord|tenant */, userId) {
  const normalizedRole = safeLower(role);
  const normalizedUserId = String(userId || '').trim();
  if (client?.active && currentRole === normalizedRole && currentUserId === normalizedUserId) return;

  const wsUrl = getWsUrl();                 // ws://.../ws/websocket
  const token = await SecureStore.getItemAsync('accessToken');
  if (!wsUrl || !token) return;

  // đóng kết nối cũ nếu có
  if (client?.active) try { client.deactivate(); } catch {}

  currentRole = normalizedRole;
  currentUserId = normalizedUserId;
  client = new Client({
    // Dùng native WebSocket của RN + ép subprotocol
    webSocketFactory: () => new WebSocket(wsUrl, ['v10.stomp', 'v11.stomp', 'v12.stomp']),

    // // RN + Spring SockJS cần 2 flag này
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,

    reconnectDelay: 3000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,

    // JWT sẽ đi trong STOMP CONNECT frame
    connectHeaders: { Authorization: `Bearer ${token}` },

    debug: (msg) => console.log('[STOMP]', msg),

    onConnect: (frame) => {
      console.log('[WS] CONNECTED', frame?.headers);
      store.dispatch(wsConnected());

      const topics = new Set();

      if (currentRole === 'admin') {
        topics.add('/topic/admin.notifications');
      } else {
        topics.add('/user/queue/notifications');
      }

      const fallbackUserId = currentUserId || store.getState()?.auth?.user?.userId;
      buildUserTopics(fallbackUserId).forEach((t) => topics.add(t));

      topics.forEach((destination) => subscribeTopic(destination));
    },

  onStompError: (f) => { console.warn('[WS] STOMP error', f?.headers, f?.body); store.dispatch(wsDisconnected()); },
  onWebSocketClose: (e) => { console.warn('[WS] closed', e?.code, e?.reason); store.dispatch(wsDisconnected()); },
  onUnhandledMessage: (m) => {
      console.warn('[WS] UNHANDLED MESSAGE', m);
    },
    onUnhandledFrame: (f) => {
      console.warn('[WS] UNHANDLED FRAME', f);
    },
    onUnhandledReceipt: (r) => {
      console.warn('[WS] UNHANDLED RECEIPT', r);
    },
  });

  client.activate();
}

export function disconnectNotificationsSocket() {
  if (!client) return;
  try { if (client.active) client.deactivate(); } catch {}
  client = null;
  currentRole = null;
  currentUserId = null;
}
