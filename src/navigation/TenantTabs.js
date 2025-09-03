import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
const Tab = createBottomTabNavigator();

export default function TenantTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="TenantHome" component={HomeScreen} options={{ title: 'Home' }} />
      {/* <Tab.Screen name="Search" component={SearchScreen} /> */}
      {/* <Tab.Screen name="Bookings" component={BookingsScreen} /> */}
    </Tab.Navigator>
  );
}
