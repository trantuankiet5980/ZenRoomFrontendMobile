import { View, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import TenantOnly from '../components/TenantOnly';
import LandlordOnly from '../components/LandlordOnly';
import ButtonPrimary from '../components/ButtonPrimary';
import { logoutThunk } from '../features/auth/authThunks';

export default function HomeScreen() {
  const role = useSelector((s) => s.auth.user?.role || '-');
  const dispatch = useDispatch();

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:12 }}>
      <Text style={{ fontSize:20, fontWeight:'bold' }}>Home</Text>
      <Text>Role hiện tại: {role}</Text>

      {/* <TenantOnly />
      <LandlordOnly /> */}

      <ButtonPrimary title="Đăng xuất" onPress={() => dispatch(logoutThunk())} />
    </View>
  );
}
