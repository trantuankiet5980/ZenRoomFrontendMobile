import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../features/auth/authThunks';
import ButtonPrimary from '../components/ButtonPrimary';
import InputText from '../components/InputText';
import TypingText from '../hooks/TypingText';

export default function LoginScreen() {
  const [phoneNumber, setPhone] = useState('');
  const [password, setPass] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);

  const onSubmit = async () => {
    const action = await dispatch(loginThunk({ phoneNumber, password }));
    if (loginThunk.fulfilled.match(action)) {
      Alert.alert('Success', 'Logged in!');
    } else {
      Alert.alert('Login failed', action.payload || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1}}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE3B8'}}>
        <Image source={require('../../assets/images/zenroom.png')} style={{ width: 200, height: 200, alignSelf: 'center', marginBottom: 20 }} />
        <View>
          <TypingText text="Chào bạn!" speed={150} pause={1000} style={{ fontSize: 35, fontWeight: 'bold', color: '#f36031' }} />
        </View>
      </View>
      <View style={{ flex: 1, padding: 20, gap: 15 }}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Đăng nhập</Text>
        <Text style={{fontSize: 14, color: '#666', paddingBottom: 10}}>
          Vui lòng thêm các thông tin dưới đây để đăng nhập vào App ZenRoom nhé!
        </Text>
        <InputText label="Số điện thoại" value={phoneNumber} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" />
        <InputText label="Mật khẩu" value={password} onChangeText={setPass} placeholder="Nhập mật khẩu" secureTextEntry />
        <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Chức năng quên mật khẩu chưa được hỗ trợ.')}>
          <Text style={{ color: '#FBB040', textAlign: 'left', fontWeight: '600' }}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <ButtonPrimary title={loading ? 'Logging in...' : 'Login'} onPress={onSubmit} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 20 }}>
          <Text style={{ color: '#666' }}>Bạn chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => Alert.alert('Register', 'Chức năng đăng ký chưa được hỗ trợ.')}>
            <Text style={{ color: '#FBB040', fontWeight: '600' }}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
