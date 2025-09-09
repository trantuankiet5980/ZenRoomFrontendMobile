import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../features/auth/authThunks';
import ButtonPrimary from '../components/ButtonPrimary';
import InputText from '../components/InputText';
import TypingText from '../hooks/TypingText';

export default function LoginScreen({navigation}) {
  const [phoneNumber, setPhone] = useState('');
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);

  const onSubmit = async () => {
    const action = await dispatch(loginThunk({ phoneNumber, password }));
    if (loginThunk.fulfilled.match(action)) {
      Alert.alert('Thành công', 'Đã đăng nhập!');
    } else {
      Alert.alert('Đăng nhập thất bại', action.payload || 'Thông tin đăng nhập không hợp lệ.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE3B8',padding: 10 }}>
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
        <InputText value={phoneNumber} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" />
        <View style={{flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: "#fff",}}>
          <TextInput
            style={{flex:1, paddingVertical: 15}}
            placeholder="Mật khẩu"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{color: '#F05A28', fontWeight: "500"}}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
          <Text style={{ color: '#FBB040', textAlign: 'left', fontWeight: '600' }}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <ButtonPrimary title={loading ? 'Logging in...' : 'Login'} onPress={onSubmit} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 20 }}>
          <Text style={{ color: '#666' }}>Bạn chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: '#FBB040', fontWeight: '600' }}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
