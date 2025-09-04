import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import VideosScreen from '../screens/VideosScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#f36031',
                tabBarInactiveTintColor: '#92A3B0',
                tabBarStyle: { height: 64, paddingBottom: 20, paddingTop: 5, bottom: 25 },
                tabBarLabelStyle: { fontSize: 13 },
            }}>

            {/* Home Tab */}
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color }) => <AntDesign name="home" size={22} color={color}/>,
                }}
            />

            {/* Video Tab */}
            <Tab.Screen
                name="Videos"
                component={VideosScreen}
                options={{
                    title: 'Lướt video',
                    tabBarIcon: ({ color }) => <MaterialIcons name="video-library" size={22} color={color} />,
                }}
            />
            {/* Messages Tab */}
            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    title: 'Tin nhắn',
                    tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={22} color={color} />,
                }}
            />
            {/* Profile Tab */}
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
                }}
            />
        </Tab.Navigator>
    )
}
