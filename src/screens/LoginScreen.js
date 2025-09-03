import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../features/auth/authThunks';
import ButtonPrimary from '../components/ButtonPrimary';
import InputText from '../components/InputText';

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
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Login</Text>
      <InputText label="Phone Number" value={phoneNumber} onChangeText={setPhone} placeholder="0123456789" keyboardType="phone-pad" />
      <InputText label="Password" value={password} onChangeText={setPass} placeholder="••••••" secureTextEntry />
      <ButtonPrimary title={loading ? 'Logging in...' : 'Login'} onPress={onSubmit} />
    </View>
  );
}
