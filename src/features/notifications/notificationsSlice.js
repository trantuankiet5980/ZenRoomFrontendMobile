import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../api/axiosInstance';

// Load danh sách từ REST
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/notifications');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: 'Load notifications failed' });
    }
  }
);

// Đánh dấu 1 cái (server)
export const markOneRead = createAsyncThunk(
  'notifications/markOneRead',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/notifications/${id}/read`);
      return id;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: 'Mark read failed' });
    }
  }
);

// Đánh dấu tất cả (server)
export const markAllReadServer = createAsyncThunk(
  'notifications/markAllReadServer',
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/notifications/read-all');
      return true;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: 'Mark all read failed' });
    }
  }
);

const slice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
    connected: false,
  },
  reducers: {
    wsConnected(state) { state.connected = true; },
    wsDisconnected(state) { state.connected = false; },
    wsUpsert(state, { payload }) {
      // payload có thể là 1 object hoặc mảng
      const incoming = Array.isArray(payload) ? payload : [payload];
      for (const n of incoming) {
        // Nếu payload là “event” thuần (không có notificationId),
        // hãy bỏ qua upsert list, chỉ dùng để show toast realtime.
        if (!n?.notificationId) continue;

        const i = state.items.findIndex(x => x.notificationId === n.notificationId);
        if (i === -1) {
          state.items.unshift(n);
          if (!n.isRead) state.unreadCount += 1;
        } else {
          // merge
          const wasUnread = !state.items[i].isRead;
          state.items[i] = { ...state.items[i], ...n };
          if (wasUnread && n.isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
  },
  extraReducers: b => {
    b.addCase(fetchNotifications.pending, s => { s.loading = true; s.error = null; });
    b.addCase(fetchNotifications.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.items = payload.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      s.unreadCount = s.items.filter(n => !n.isRead).length;
    });
    b.addCase(fetchNotifications.rejected, (s,{payload}) => {
      s.loading = false;
      s.error = payload?.message || 'Load notifications failed';
    });

    b.addCase(markOneRead.fulfilled, (s, { payload:id }) => {
      const i = s.items.findIndex(x => x.notificationId === id);
      if (i > -1 && !s.items[i].isRead) {
        s.items[i].isRead = true;
        s.unreadCount = Math.max(0, s.unreadCount - 1);
      }
    });

    b.addCase(markAllReadServer.fulfilled, (s) => {
      s.items = s.items.map(n => ({ ...n, isRead: true }));
      s.unreadCount = 0;
    });
  }
});

export const { wsConnected, wsDisconnected, wsUpsert } = slice.actions;
export default slice.reducer;
