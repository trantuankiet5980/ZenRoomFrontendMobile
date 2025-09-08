import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuthOTPScreen from '../screens/AuthOTPScreen';

const Stack = createNativeStackNavigator();
export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AuthOTP" component={AuthOTPScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
