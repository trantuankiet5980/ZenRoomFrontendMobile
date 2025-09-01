import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MainScreen from "../screens/MainScreen";
import RegisterScreen from "../screens/RegisterScreen";
import AuthOTPScreen from "../screens/AuthOTPScreen";
import LoginScreen from "../screens/LoginScreen ";

const AuthStack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="MainScreen" component={MainScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="AuthOTP" component={AuthOTPScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
