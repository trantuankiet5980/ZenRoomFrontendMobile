import { View, Text, Linking } from 'react-native';
import ButtonPrimary from '../components/ButtonPrimary';
import { useDispatch } from 'react-redux';
import { logoutThunk } from '../features/auth/authThunks';

const ADMIN_DASHBOARD_URL = 'https://admin.your-domain.com'; // đổi theo thực tế

export default function AdminBlockedScreen() {
  const dispatch = useDispatch();
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:'bold', textAlign:'center' }}>
        Tài khoản Admin chỉ sử dụng trên trang quản trị.
      </Text>
      <ButtonPrimary title="Mở trang quản trị" onPress={() => Linking.openURL(ADMIN_DASHBOARD_URL)} />
      <ButtonPrimary title="Đăng xuất" onPress={() => dispatch(logoutThunk())} />
    </View>
  );
}
