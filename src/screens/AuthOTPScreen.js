import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  verifyOtpThunk,
  verifyResetOtpThunk,
  sendResetOtpThunk
} from "../features/auth/authThunks";

const AuthOTPScreen = ({ route, navigation }) => {
  const { phoneNumber, mode } = route.params || {};
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleChange = (text, index) => {
    if (!/^\d?$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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

  const handleResend = async () => {
    setTimeLeft(30);
    setCanResend(false);

    if (mode === 'reset') {
      const result = await dispatch(sendResetOtpThunk({ phoneNumber }));
      if (result.meta.requestStatus === 'fulfilled') {
        Alert.alert("Thành công", "Mã OTP mới đã được gửi!");
      } else {
        Alert.alert("Lỗi", result.payload || "Gửi lại OTP thất bại");
      }
    } else {
      Alert.alert("Thành công", "Mã OTP mới đã được gửi!");
    }
  };

  const handleConfirm = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số");
      return;
    }

    let result;
    if (mode === 'reset') {
      result = await dispatch(verifyResetOtpThunk({ phoneNumber, otp: code }));
    } else {
      result = await dispatch(verifyOtpThunk({ phoneNumber, otp: code }));
    }

    if (result.meta.requestStatus === 'fulfilled') {
      if (mode === 'register') {
        navigation.replace("Login");
      } else if (mode === 'reset') {
        navigation.replace("ResetPasswordScreen", { phoneNumber });
      } else {
        navigation.replace("Login");
      }
    } else {
      Alert.alert("Thất bại", result.payload || "OTP không đúng");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực OTP</Text>
      </View>

      <Text style={styles.title}>Nhập mã xác thực OTP</Text>
      <Text style={styles.subtitle}>
        ZenRoom đã gửi mã xác thực đến số điện thoại {phoneNumber}.
        {"\n"}Bạn hãy kiểm tra tin nhắn SMS nhé!
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            returnKeyType="next"
            onSubmitEditing={() => index < 5 && inputRefs.current[index + 1]?.focus()}
            blurOnSubmit={false}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Tiếp tục</Text>}
      </TouchableOpacity>

      <Text style={styles.resendText}>
        {canResend ? (
          <Text style={styles.resendLink} onPress={handleResend}>Gửi lại mã</Text>
        ) : (
          `Bạn có thể yêu cầu mã mới sau ${timeLeft}s`
        )}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </SafeAreaView>
  );
};

export default AuthOTPScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30, marginTop: 20 },
  backButton: { marginRight: 10, padding: 5 },
  backText: { fontSize: 35 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 30 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  otpInput: {
    width: 50, height: 50, borderWidth: 1, borderColor: "#DDD",
    borderRadius: 8, textAlign: "center", fontSize: 20, backgroundColor: "#fff"
  },
  button: {
    backgroundColor: "#FBB040", padding: 17, borderRadius: 10,
    alignItems: "center", marginTop: 10
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  resendText: { textAlign: "center", fontSize: 14, color: "#444", marginTop: 20 },
  resendLink: { color: "#F05A28", fontWeight: "bold" },
  errorText: { color: "red", marginTop: 10, textAlign: "center" }
});