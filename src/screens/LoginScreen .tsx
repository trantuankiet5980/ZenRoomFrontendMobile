import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/images/zenroom.png")}
          style={{ width: 157, height: 157 }}
        />
        <View>
          <Text style={styles.headerTitle}>ZenRoom</Text>
          <Text style={styles.welcome}>Chào bạn!</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>
        Vui lòng thêm các thông tin dưới đây để đăng nhập vào App ZenRoom nhé!
      </Text>

      {/* Input số điện thoại */}
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Password */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mật khẩu"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      {/* Quên mật khẩu */}
      <TouchableOpacity>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      {/* Button đăng nhập */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("Home")} // chuyển sang màn Home
      >
        <Text style={styles.loginText}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Chưa có tài khoản */}
      <Text style={styles.registerText}>
        Chưa có tài khoản?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          Đăng ký ngay
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    top: -50,
  },
  backText: {
    fontSize: 35,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE3B8",
    // padding: 10,
    borderRadius: 10,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#F05A28",
  },
  welcome: {
    fontSize: 16,
    marginLeft: 10,
    color: "#B0A773",
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },
  showText: {
    color: "#F05A28",
    fontWeight: "500",
  },
  forgotText: {
    color: "#333",
    textAlign: "left",
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#ff9900",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  registerLink: {
    color: "#ff9900",
    fontWeight: "bold",
  },
});

export default LoginScreen;
