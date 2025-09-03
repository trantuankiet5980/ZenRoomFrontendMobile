import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigationRef } from './NavigationService';
import AuthStack from './AuthStack';
import TenantTabs from './TenantTabs';
import LandlordTabs from './LandlordTabs';
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
      {role === 'tenant' && <TenantTabs />}
      {role === 'landlord' && <LandlordTabs />}
      {role === 'admin' && <AdminBlockedScreen />}
      {!role && <TenantTabs />}{/* fallback an toàn */}
    </NavigationContainer>
  );
}
