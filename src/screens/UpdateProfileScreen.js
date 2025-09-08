import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const BORDER = '#E5E7EB';
const MUTED  = '#9CA3AF';

export default function UpdateProfileScreen() {
    useHideTabBar();      
    const nav = useNavigation();

    const user = useSelector(s => s.auth.user);
    const name  = user?.fullName || user?.name || 'Người dùng';

    const [fullName, setFullName] = useState('');
    const [phone, setPhone]       = useState('');
    const [email, setEmail]       = useState('');
    const [dob, setDob]           = useState('');
    const [gender, setGender]     = useState('Khác');

    const onSave = () => {
        console.log('UPDATE_PROFILE', { fullName, phone, email, dob, gender });
    };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:'#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ height:56, flexDirection:'row', alignItems:'center', paddingHorizontal:12, marginTop:30, borderBottomWidth:1, borderColor:'#F5F5F5' }}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ padding:8, marginRight:4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize:18, fontWeight:'700' }}>Cập nhật thông tin</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:140 }}>
        {/* Avatar placeholder */}
        <View style={{ alignItems:'center', marginVertical:16 }}>
          <View style={{ width:84, height:84, borderRadius:16, backgroundColor:'#F2F3F4', alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="image-outline" size={30} color={MUTED} />
            <View style={{ position:'absolute', right:-4, bottom:-4, backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:BORDER }}>
              <Ionicons name="lock-closed" size={16} color={ORANGE} style={{ padding:4 }} />
            </View>
          </View>
        </View>

        <Field label="Họ và tên" value={name} onChangeText={setFullName} />
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Ngày sinh" value={dob} onChangeText={setDob} placeholder="dd/mm/yyyy" />
        <Field label="Giới tính" value={gender} onChangeText={setGender} />
      </ScrollView>

      {/* nút cập nhật cố định */}
      <View style={{ position:'absolute', left:0, right:0, bottom:20, paddingHorizontal:16 }}>
        <TouchableOpacity
          onPress={onSave}
          activeOpacity={0.9}
          style={{ height:54, borderRadius:16, backgroundColor:ORANGE, alignItems:'center', justifyContent:'center' }}
        >
          <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>Cập nhật</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom:14 }}>
      <Text style={{ marginBottom:8, color:'#111' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={MUTED}
        style={{
          height:48, borderRadius:12, borderWidth:1, borderColor:BORDER,
          paddingHorizontal:14, backgroundColor:'#fff'
        }}
      />
    </View>
  );
}
