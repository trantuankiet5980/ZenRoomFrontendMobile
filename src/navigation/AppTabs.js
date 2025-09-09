import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CreatePostStack from '../navigation/CreatePostStack';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';
import HomeStack from './HomeStack';

import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useRole } from '../hooks/useRole';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    const { isLandlord } = useRole();
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
                component={HomeStack}
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color }) => <AntDesign name="home" size={22} color={color} />,
                }}
            />

            {/* Tạo bài đăng Tab */}
            {isLandlord && (
                <Tab.Screen
                    name="Tạo bài đăng"
                    component={CreatePostStack}
                    options={{
                        title: 'Tạo bài đăng',
                        tabBarIcon: ({ color }) => <MaterialIcons name="create" size={22} color={color} />,
                    }}
                />
            )}
            {/* Messages Tab */}
            <Tab.Screen
                name="Chat"
                component={ChatStack}
                options={{
                    title: 'Tin nhắn',
                    tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={22} color={color} />,
                }}
            />
            {/* Profile Tab */}
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
                }}
            />
        </Tab.Navigator>
    )
}
