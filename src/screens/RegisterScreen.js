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
import TypingText from '../hooks/TypingText';
import { useDispatch } from "react-redux";
import { registerThunk } from "../features/auth/authThunks";
import { Alert } from "react-native";


const RegisterScreen = ({ navigation }) => {
    const [role, setRole] = useState("tenant");
    const dispatch = useDispatch();
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onSubmit = async () => {
        const payload = { fullName, phoneNumber, password, roles: [role] };
        console.log('Register payload:', payload);
        const action = await dispatch(registerThunk(payload));
        console.log('Register action:', action);

        if (registerThunk.fulfilled.match(action)) {
            console.log("Register success, navigating to OTP...");
            Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng xác thực OTP được gửi qua số điện thoại.');
            navigation.navigate('AuthOTP', { phoneNumber, mode: 'register' });
        } else {
            console.log("Register failed:", action.payload);
            Alert.alert('Đăng ký thất bại', action.payload || 'Thông tin đăng ký không hợp lệ.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE3B8', padding: 10 }}>
                <View>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={require('../../assets/images/zenroom.png')} style={{ width: 200, height: 200, alignSelf: 'center', marginBottom: 20 }} />
                    <View>
                        <TypingText text="Chào bạn!" speed={150} pause={1000} style={{ fontSize: 35, fontWeight: 'bold', color: '#f36031' }} />
                    </View>
                </View>
            </View>
            <View style={{ flex: 1, padding: 20 }}>
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
                        onPress={() => setRole("landlord")}
                    >
                        <View
                            style={[
                                styles.radioCircle,
                                role === "landlord" && styles.radioActive,
                            ]}
                        />
                        <Text
                            style={role === "landlord" ? styles.radioTextActive : styles.radioText}
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
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Họ và tên"
                    value={fullName}
                    onChangeText={setFullName}
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
                <TouchableOpacity style={styles.button} onPress={onSubmit}>
                    <Text style={styles.buttonText}>Tiếp tục</Text>
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.footer}>
                    Bạn đã có tài khoản?{" "}
                    <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
                        Đăng nhập ngay
                    </Text>
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    backButton: {
        justifyContent: "center",
        alignItems: "center",
        top: -50,
        // marginLeft: 10,
    },
    backText: {
        fontSize: 50,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
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
        padding: 15,
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    passwordWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 15,
    },
    showText: {
        color: "#F05A28",
        fontWeight: "500",
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
    footer: {
        marginTop: 20,
        textAlign: "center",
        color: "#333",
    },
    link: {
        color: "#FBB040",
        fontWeight: "600",
    },
});
