import { Client } from "@stomp/stompjs";
import { store } from "../app/store";
import { setSocketConnected } from "../features/chat/chatSlice";
import { showToast } from "../utils/AppUtils";

let client = null;
let isActive = false;
const pendingSubs = new Map();

const WS_URL = 'ws://10.0.2.2:8080/ws';

export function initSocket(token, meId) {
  if (client) return client; // đã init

  client = new Client({
    webSocketFactory: () => new WebSocket(WS_URL, ['v12.stomp']),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    // debug: (str) => console.log("[WS]", str),
    debug: () => {},
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
  });

  client.onConnect = () => {
    console.log("Socket connected");
    isActive = true;
    store.dispatch(setSocketConnected(true));
    try {
      if (meId) {
        const topic = `/topic/notify.${meId}`;
        client.subscribe(topic, (frame) => {
          const msg = frame.body || "Bạn có tin nhắn mới";
          console.log("Notify (topic):", msg);
          showToast("info", "top", "Thông báo", msg);
        });
      }
    } catch (e) {
      console.log("Subscribe topic notify error:", e?.message);
    }
    // chạy các pending subscribe (nếu có màn hình gọi trước khi connected)
    for (const [convId, cbs] of pendingSubs.entries()) {
      cbs.forEach(cb => cb());
    }
    pendingSubs.clear();
  };

  client.onStompError = (frame) => {
    console.log("STOMP error:", frame?.headers, frame?.body);
  };
  client.onWebSocketClose = (evt) => {
    console.log("Socket closed", evt?.code, evt?.reason);
    isActive = false;
    store.dispatch(setSocketConnected(false));  // cập nhật Redux
  };

  client.activate();
  return client;
}

export function getClient() {
  return client;
}

export function ensureConnected(cb, conversationId) {
  // nếu đã connected => chạy ngay
  if (client && client.connected) { cb(); return; }
  // chưa connected => ghim callback, sẽ gọi sau khi onConnect
  if (!pendingSubs.has(conversationId)) pendingSubs.set(conversationId, []);
  pendingSubs.get(conversationId).push(cb);
}

export function isConnected() {
  return !!client && client.connected;
}