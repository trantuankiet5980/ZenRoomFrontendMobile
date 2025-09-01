import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "../navigation/AuthNavigator";

const RootStack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        {/* Flow đầu tiên khi chưa login */}
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
