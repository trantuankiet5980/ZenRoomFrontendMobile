import React from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";

const MainScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <ImageBackground
        source={require("../../assets/images/start.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Nội dung overlay trên background */}
        <View style={styles.overlay}>
          {/* Nút Get Start */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.buttonText}>Get Start</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  button: {
    backgroundColor: "#FBB040",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    top: 230,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
