import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import ButtonPrimary from '../components/ButtonPrimary';
import TypingText from '../hooks/TypingText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { changePasswordThunk } from '../features/auth/authThunks';


export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigation = useNavigation();

    const onSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp.');
            return;
        }

        try {
            const resultAction = await dispatch(changePasswordThunk({ currentPassword, newPassword }));
            if (changePasswordThunk.fulfilled.match(resultAction)) {
                Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
                navigation.goBack();
            } else {
                Alert.alert('Lỗi', resultAction.payload || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Đổi mật khẩu thất bại');
        }
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE3B8', padding: 10 }}>
                <TouchableOpacity
                    style={{ justifyContent: 'center', alignItems: 'center', top: -50 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ fontSize: 50 }}>‹</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={require('../../assets/images/zenroom.png')}
                        style={{ width: 200, height: 200, alignSelf: 'center', marginBottom: 20 }}
                    />
                    <TypingText text="Chào bạn!" speed={150} pause={1000} style={{ fontSize: 35, fontWeight: 'bold', color: '#f36031' }} />
                </View>
            </View>

            <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Đổi mật khẩu mới</Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                    Vui lòng thêm các thông tin dưới đây để đổi lại mật khẩu của bạn để đăng nhập vào App ZenRoom nhé!
                </Text>

                {/* Mật khẩu hiện tại */}
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, paddingHorizontal: 10 }}>
                    <TextInput
                        style={{ flex: 1, paddingVertical: 10 }}
                        placeholder="Mật khẩu hiện tại"
                        secureTextEntry={!showPassword}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={{ color: '#F05A28', fontWeight: '500' }}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Mật khẩu mới */}
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, paddingHorizontal: 10 }}>
                    <TextInput
                        style={{ flex: 1, paddingVertical: 10 }}
                        placeholder="Mật khẩu mới"
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={{ color: '#F05A28', fontWeight: '500' }}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Nhập lại mật khẩu mới */}
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 30, paddingHorizontal: 10 }}>
                    <TextInput
                        style={{ flex: 1, paddingVertical: 10 }}
                        placeholder="Nhập lại mật khẩu mới"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={{ color: '#F05A28', fontWeight: '500' }}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                </View>

                <ButtonPrimary title="Xác nhận" onPress={onSubmit} />
            </View>
        </SafeAreaView>
    );
}