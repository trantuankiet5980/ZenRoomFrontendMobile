import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import ButtonPrimary from '../components/ButtonPrimary';
import TypingText from '../hooks/TypingText';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { sendResetOtpThunk } from "../features/auth/authThunks";

export default function ForgotPasswordScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const onSubmit = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    try {
      const resultAction = await dispatch(sendResetOtpThunk({ phoneNumber }));
      if (sendResetOtpThunk.fulfilled.match(resultAction)) {
        Alert.alert('Thành công', 'OTP đã được gửi về số điện thoại.');
        navigation.navigate('AuthOTP', { phoneNumber, mode: 'reset' });
      } else {
        Alert.alert('Lỗi', resultAction.payload || 'Gửi OTP thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Gửi OTP thất bại');
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
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Quên mật khẩu</Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
          Vui lòng thêm các thông tin dưới đây để lấy lại mật khẩu của bạn để đăng nhập vào App ZenRoom nhé!
        </Text>

        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 15,
            paddingVertical: 15,
            marginBottom: 20,
          }}
          keyboardType="phone-pad"
          placeholder="Số điện thoại"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <ButtonPrimary title="Xác nhận" onPress={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
