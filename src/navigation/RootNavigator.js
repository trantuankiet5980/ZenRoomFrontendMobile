import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigationRef } from './NavigationService';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import AdminBlockedScreen from '../screens/AdminBlockedScreen';
import { loadSessionThunk } from '../features/auth/authThunks';
import Loader from '../components/Loader';

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token, loadedSession, user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadSessionThunk());
  }, [dispatch]);

  if (!loadedSession) return <Loader />;

  if (!token) {
    return (
      <NavigationContainer ref={navigationRef}>
        <AuthStack />
      </NavigationContainer>
    );
  }

  const role = user?.role?.toLowerCase?.();

  return (
    <NavigationContainer ref={navigationRef}>
      {!token ? (
        <AuthStack />
      ) : role === 'admin' ? (
        <AdminBlockedScreen />
      ) : (
        <AppTabs />
      )}
    </NavigationContainer>
  );
}
