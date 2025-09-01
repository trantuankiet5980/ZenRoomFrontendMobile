import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";

const RegisterScreen = ({ navigation }: any) => {
  const [role, setRole] = useState<"tenant" | "owner">("tenant");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
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
      <Text style={styles.title}>Đăng ký tài khoản</Text>
      <Text style={styles.subtitle}>
        Vui lòng thêm các thông tin dưới đây để tiếp tục đăng ký tài khoản
        ZenRoom nhé!
      </Text>

      {/* Role select */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={styles.radioRow}
          onPress={() => setRole("tenant")}
        >
          <View
            style={[
              styles.radioCircle,
              role === "tenant" && styles.radioActive,
            ]}
          />
          <Text
            style={
              role === "tenant" ? styles.radioTextActive : styles.radioText
            }
          >
            Người thuê
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioRow}
          onPress={() => setRole("owner")}
        >
          <View
            style={[styles.radioCircle, role === "owner" && styles.radioActive]}
          />
          <Text
            style={role === "owner" ? styles.radioTextActive : styles.radioText}
          >
            Chủ nhà
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form inputs */}
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        keyboardType="phone-pad"
      />
      <TextInput style={styles.input} placeholder="Họ và tên" />

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

      {/* Confirm password */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Nhập lại mật khẩu"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text style={styles.showText}>
            {showConfirmPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AuthOTP")}>
        <Text
          style={styles.buttonText}
          
        >
          Tiếp tục
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Bạn đã có tài khoản?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Đăng nhập ngay
        </Text>
      </Text>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
    marginTop: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 6,
  },
  radioActive: {
    backgroundColor: "#F05A28",
    borderColor: "#F05A28",
  },
  radioText: {
    color: "#555",
  },
  radioTextActive: {
    color: "#F05A28",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
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
  button: {
    backgroundColor: "#FBB040",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#333",
  },
  link: {
    color: "#F05A28",
    fontWeight: "600",
  },
});
