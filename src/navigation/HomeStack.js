import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SearchPostScreen from '../screens/SearchPostScreen';

import CreateBuilding from '../screens/CreateBuilding';
import CreateRoom from '../screens/CreateRoom';
import CreatePost from '../screens/CreatePost';
import CreateContract from '../screens/CreateContract';

import RoomsInventoryManagerScreen from '../screens/RoomsInventoryManagerScreen';
import PostManagerScreen from '../screens/PostsManagerScreen';
import TenantsManagerScreen from '../screens/TenantsManagerScreen';
import ContractsManagerScreen from '../screens/ContractsManagerScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />

      {/* Search dùng chung 2 role */}
      <Stack.Screen name="SearchRooms" component={SearchPostScreen} options={{ title: 'Tìm kiếm tin đăng' }} />

      {/* Create */}
      <Stack.Screen name="CreateBuilding" component={CreateBuilding} options={{ title: 'Tạo tòa nhà' }} />
      <Stack.Screen name="CreateRoom" component={CreateRoom} options={{ title: 'Tạo phòng' }} />
      <Stack.Screen name="CreatePost" component={CreatePost} options={{ title: 'Tạo bài viết' }} />
      <Stack.Screen name="CreateContract" component={CreateContract} options={{ title: 'Tạo hợp đồng' }} />

      {/* Manager */}
      <Stack.Screen name="RoomsInventoryManager" component={RoomsInventoryManagerScreen} options={{ title: 'Quản lý phòng' }} />
      <Stack.Screen name="PostsManager" component={PostManagerScreen} options={{ title: 'Quản lý tin đăng' }} />
      <Stack.Screen name="TenantsManager" component={TenantsManagerScreen} options={{ title: 'Quản lý khách thuê' }} />
      <Stack.Screen name="ContractsManager" component={ContractsManagerScreen} options={{ title: 'Quản lý hợp đồng' }} />

    </Stack.Navigator>
  );
}
