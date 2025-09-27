import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SearchPostScreen from '../screens/SearchPostScreen';
import CreateContract from '../screens/CreateContractScreen';

import RoomsInventoryManagerScreen from '../screens/RoomsInventoryManagerScreen';
import PostManagerScreen from '../screens/PostsManagerScreen';
import TenantsManagerScreen from '../screens/TenantsManagerScreen';
import ContractsManagerScreen from '../screens/ContractsManagerScreen';

import InventoryBuildings from '../screens/InventoryBuildingsScreen';
import InventoryRooms from '../screens/InventoryRoomsScreen';

import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import CreatePostStack from './CreatePostStack';

import NotificationsScreen from '../screens/NotificationsScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import BookingForm from '../screens/BookingFormScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />

      {/* Search dùng chung 2 role */}
      <Stack.Screen name="SearchRooms" component={SearchPostScreen} options={{ title: 'Tìm kiếm tin đăng' }} />

      {/* Create */}
      <Stack.Screen name="CreateContract" component={CreateContract} options={{ title: 'Tạo hợp đồng', headerShown: false }} />

      {/* Manager */}
      <Stack.Screen name="RoomsInventoryManager" component={RoomsInventoryManagerScreen} options={{ title: 'Quản lý phòng', headerShown: false }} />
      <Stack.Screen name="InventoryBuildings" component={InventoryBuildings} options={{ title: '', headerShown: false }} />
      <Stack.Screen name="InventoryRooms" component={InventoryRooms} options={{ title: '', headerShown: false }} />
      <Stack.Screen name="PostsManager" component={PostManagerScreen} options={{ title: 'Quản lý tin đăng', headerShown: false }} />
      <Stack.Screen name="TenantsManager" component={TenantsManagerScreen} options={{ title: 'Quản lý khách thuê', headerShown: false }} />
      <Stack.Screen name="ContractsManager" component={ContractsManagerScreen} options={{ title: 'Quản lý hợp đồng', headerShown: false }} />


      {/* Detail */}
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Chi tiết bất động sản', headerShown: false }} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookingForm" component={BookingForm} options={{ title: 'Đặt phòng' }} />

      {/* Create Post */}
      <Stack.Screen name="CreatePostStack" component={CreatePostStack} options={{ headerShown: false }} />

      {/* Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    </Stack.Navigator>
  );
}
