import { Provider, useSelector, useDispatch } from 'react-redux';
import React, { useEffect } from "react";
import { store } from './src/app/store';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { initSocket } from './src/sockets/socket';
import { fetchNotifications } from './src/features/notifications/notificationsSlice';
import { connectNotificationsSocket, disconnectNotificationsSocket } from './src/hooks/useNotificationsSocket';

function SocketBootstrapper() {
  const token = useSelector(s => s.auth.token);
  const meId = useSelector(s => s.auth.user?.userId);
  useEffect(() => {
    if (token) {
      // chỉ gọi 1 lần, initChatSocket sẽ tự bỏ qua nếu đã init
      initSocket(token, meId);
    }
  }, [token, meId]);
  return null;
}

function NotificationsBootstrapper() {
  const dispatch = useDispatch();
  const token = useSelector(s => s.auth.token);
  const role = useSelector(s => s.auth.user?.role);
  const userId = useSelector(s => s.auth.user?.userId);

  useEffect(() => {
    if (token) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (token && role && userId) {
      connectNotificationsSocket(role, userId);
      return () => {
        disconnectNotificationsSocket();
      };
    }

    disconnectNotificationsSocket();
    return undefined;
  }, [token, role, userId]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
      <Toast />
      <SocketBootstrapper />
      <NotificationsBootstrapper />
    </Provider>
  );
}
