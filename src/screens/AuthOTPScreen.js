import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtpThunk } from "../features/auth/authThunks";

const AuthOTPScreen = ({ route, navigation }) => {
  const { phoneNumber, mode } = route.params || {};
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  };

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleResend = () => {
    setTimeLeft(30);
    setCanResend(false);
    console.log("Mã OTP mới đã được gửi!");
    // TODO: gọi API gửi lại OTP
  };

  const handleConfirm = async () => {
  const code = otp.join("");
  if (!phoneNumber) {
    alert("Không tìm thấy số điện thoại để xác thực");
    return;
  }

  const result = await dispatch(verifyOtpThunk({ phoneNumber, otp: code }));
  if (verifyOtpThunk.fulfilled.match(result)) {
    // Xác thực thành công
    if (mode === 'register') {
      navigation.replace("Login");
    } else if (mode === 'reset') {
      navigation.replace("ResetPasswordScreen", { phoneNumber });
    } else {
      // Nếu chưa truyền mode thì chuyển về login để tránh lỗi
      navigation.replace("Login");
    }
  } else {
    alert(result.payload || "Xác thực OTP thất bại");
  }
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực OTP</Text>
      </View>

      {/* Nội dung */}
      <Text style={styles.title}>Nhập mã xác thực OTP</Text>
      <Text style={styles.subtitle}>
        ZenRoom đã gửi mã xác thực đến số điện thoại {phoneNumber}.
        {"\n"}Bạn hãy kiểm tra tin nhắn SMS nhé!
      </Text>

      {/* Input OTP */}
      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
          />
        ))}
      </View>

      {/* Nút xác nhận */}
      <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tiếp tục</Text>
        )}
      </TouchableOpacity>

      {/* Đếm ngược */}
      <Text style={styles.resendText}>
        {canResend ? (
          <Text style={styles.resendLink} onPress={handleResend}>
            Gửi lại mã
          </Text>
        ) : (
          `Bạn có thể yêu cầu mã mới sau ${timeLeft}s`
        )}
      </Text>

      {error && <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>}
    </SafeAreaView>
  );
};

export default AuthOTPScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  backText: {
    fontSize: 35,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#fff",
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendText: {
    textAlign: "center",
    fontSize: 14,
    color: "#444",
  },
  resendLink: {
    color: "#F05A28",
    fontWeight: "bold",
  },
  button: {
        backgroundColor: "#FBB040",
        padding: 17,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
