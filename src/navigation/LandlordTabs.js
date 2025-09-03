import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
const Tab = createBottomTabNavigator();

export default function LandlordTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="LandlordHome" component={HomeScreen} options={{ title: 'Home' }} />
      {/* <Tab.Screen name="MyListings" component={MyListingsScreen} /> */}
      {/* <Tab.Screen name="Reservations" component={ReservationsScreen} /> */}
    </Tab.Navigator>
  );
}
