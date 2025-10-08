import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ContractDetailScreen from '../screens/ContractDetailScreen';
import ChangePasswordScreen from '../screens/ChangePasswordSrceen';
import TenantsManagerScreen from '../screens/TenantsManagerScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
      <Stack.Screen name="MyBookingsScreen" component={MyBookingsScreen} options={{ title: 'Đơn đặt phòng của tôi' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Chi tiết booking' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Thanh toán' }} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ title: 'Chi tiết hợp đồng', headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="TenantsManager" component={TenantsManagerScreen} options={{ title: 'Quản lý khách thuê', headerShown: false }} />
    </Stack.Navigator>
  );
}
