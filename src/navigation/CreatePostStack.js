import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChoosePostTypeScreen from '../screens/ChoosePostTypeScreen';
import CreateBuilding from '../screens/CreateBuildingScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import PostsManagerScreen from '../screens/PostsManagerScreen';

const Stack = createNativeStackNavigator();

export default function CreatePostStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChoosePostType" component={ChoosePostTypeScreen} />
      <Stack.Screen name="CreateBuilding" component={CreateBuilding} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="PostsManager" component={PostsManagerScreen} />
    </Stack.Navigator>
  );
}
