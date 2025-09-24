import { Provider, useSelector } from 'react-redux';
import React, { useEffect } from "react";
import { store } from './src/app/store';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { initSocket } from './src/sockets/socket';

function SocketBootstrapper() {
  const token = useSelector(s => s.auth.token);
  useEffect(() => {
    if (token) {
      // chỉ gọi 1 lần, initChatSocket sẽ tự bỏ qua nếu đã init
      initSocket(token);
    }
  }, [token]);
  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
      <Toast />
      <SocketBootstrapper />
    </Provider>
  );
}
