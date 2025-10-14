import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import useHideTabBar from '../hooks/useHideTabBar';
import { updateProfile, getProfile, uploadAvatar, getPresignedAvatar } from '../features/user/userThunks';

const ORANGE = '#f36031';
const BORDER = '#E5E7EB';
const MUTED = '#9CA3AF';

export default function UpdateProfileScreen() {
  useHideTabBar();
  const nav = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(s => s.user.user);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [dobISO, setDobISO] = useState('');
  const [gender, setGender] = useState('UNSPECIFIED');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const genderOptions = [
    { label: 'Nam', value: 'MALE' },
    { label: 'Nữ', value: 'FEMALE' },
    { label: 'Khác', value: 'OTHER' },
    { label: 'Không xác định', value: 'UNSPECIFIED' },
  ];


  useEffect(() => {
    if (user) {
      setFullName(user?.fullName || user?.name || '');
      setPhone(user?.phoneNumber || user?.phone || '');
      setEmail(user?.email || '');
      setDob(user?.dateOfBirth ? formatDate(new Date(user.dateOfBirth)) : '');
      setDobISO(user?.dateOfBirth || '');
      setGender(user?.gender || 'UNSPECIFIED');

      // Lấy avatar presigned từ backend
      dispatch(getPresignedAvatar())
        .unwrap()
        .then(res => setAvatarUrl(res.url))
        .catch(err => console.error("Lấy avatar thất bại:", err));
    }
  }, [user]);


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const fileUri = result.assets[0].uri;
      const filename = fileUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type,
      });

      try {
        const res = await dispatch(uploadAvatar(formData));
        if (uploadAvatar.fulfilled.match(res)) {
          setAvatarUrl(res.payload.url);
          alert('Cập nhật avatar thành công!');
        } else {
          alert('Cập nhật avatar thất bại');
        }
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi upload avatar');
      }
    }
  };

  const onSave = async () => {
    const payload = { fullName, phoneNumber: phone, email, dateOfBirth: dobISO, gender };
    try {
      const res = await dispatch(updateProfile(payload));
      if (updateProfile.fulfilled.match(res)) {
        await dispatch(getProfile());
        alert('Cập nhật thành công!');
        nav.goBack();
      } else {
        alert('Cập nhật thất bại: ' + (res.payload?.message || 'Lỗi server'));
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30, borderBottomWidth: 1, borderColor: '#F5F5F5' }}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Cập nhật thông tin</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <View style={{ width: 84, height: 84, borderRadius: 16, backgroundColor: '#F2F3F4', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 84, height: 84, borderRadius: 16 }} />
            ) : (
              <Ionicons name="image-outline" size={30} color={MUTED} />
            )}

            <TouchableOpacity
              onPress={pickImage}
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
                padding: 4
              }}
            >
              <Ionicons name="camera" size={16} color={ORANGE} />
            </TouchableOpacity>
          </View>
        </View>

        <Field label="Họ và tên" value={fullName} onChangeText={setFullName} />
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

        {/* Ngày sinh */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ marginBottom: 8, color: '#111' }}>Ngày sinh</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#fff' }}>
            <Text style={{ color: dob ? '#000' : MUTED }}>{dob || 'dd/mm/yyyy'}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dobISO ? new Date(dobISO) : new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(formatDate(selectedDate));
                  setDobISO(selectedDate.toISOString());
                }
              }}
            />
          )}
        </View>

        {/* Giới tính */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ marginBottom: 8, color: '#111' }}>Giới tính</Text>
          <TouchableOpacity onPress={() => setShowGenderPicker(true)} style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#fff' }}>
            <Text style={{ color: gender ? '#000' : MUTED }}>
              {genderOptions.find(g => g.value === gender)?.label || 'Không xác định'}
            </Text>
          </TouchableOpacity>

          <Modal visible={showGenderPicker} transparent animationType="slide">
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <View style={{ backgroundColor: '#fff' }}>
                <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)}>
                  {genderOptions.map(opt => (<Picker.Item key={opt.value} label={opt.label} value={opt.value} />))}
                </Picker>
                <TouchableOpacity onPress={() => setShowGenderPicker(false)} style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: ORANGE, fontWeight: 'bold' }}>Xong</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

      </ScrollView>

      {/* Nút cập nhật */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 20, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={onSave} activeOpacity={0.9} style={{ height: 54, borderRadius: 16, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Cập nhật</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ marginBottom: 8, color: '#111' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={MUTED}
        style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, backgroundColor: '#fff' }}
      />
    </View>
  );
}

function formatDate(date) {
  const d = new Date(date);
  const day = ('0' + d.getDate()).slice(-2);
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
