import { Provider } from 'react-redux';
import { store } from './src/app/store';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import NotificationsSocketManager from './src/hooks/NotificationsSocketManager';

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
      <NotificationsSocketManager />
      <Toast />
    </Provider>
  );
}
