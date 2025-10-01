import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logoutThunk } from '../features/auth/authThunks';
import { getProfile } from '../features/user/userThunks';

const ORANGE = '#f36031';
const BORDER = '#E5E7EB';
const MUTED = '#6B7280';

export default function ProfileScreen() {
  const nav = useNavigation();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.user);

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const name = user?.fullName || user?.name || "Người dùng";
  const phone = user?.phoneNumber || user?.phone || "—";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header cam */}
      <View style={{ height: 120, backgroundColor: ORANGE }} />

      {/* Thẻ user */}
      <TouchableOpacity
        onPress={() => nav.navigate("UpdateProfile")}
        activeOpacity={0.9}
        style={{
          marginHorizontal: 16,
          marginTop: -32,
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 14,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#FFE1E1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person" size={22} color="#E26666" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontWeight: "700" }}>{name}</Text>
          <Text style={{ color: MUTED, marginTop: 2 }}>{phone}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#111" />
      </TouchableOpacity>

      {/* Menu */}
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <MenuItem
          icon="key-outline"
          label="Đổi mật khẩu"
          onPress={() => nav.navigate("ResetPasswordScreen")}
        />

        {user?.role === "tenant" && (
          <MenuItem
            icon="albums-outline"
            label="Danh sách booking của tôi"
            onPress={() => nav.navigate("MyBookingsScreen")}
          />
        )}

        <MenuItem
          icon="exit-outline"
          label="Đăng xuất"
          onPress={() => dispatch(logoutThunk())}
        />
      </View>
      {/* Yêu cầu xoá tài khoản */}
      <TouchableOpacity
        onPress={() => console.log('Yêu cầu xóa tài khoản')}
        style={{ marginHorizontal: 16, marginTop: 18, flexDirection: 'row', alignItems: 'center' }}
      >
        <Ionicons name="leaf-outline" size={18} color="#16a34a" />
        <Text style={{ marginLeft: 8, color: '#111', fontWeight: '700' }}>Yêu cầu xóa tài khoản</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12,
        marginBottom: 10, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: BORDER
      }}
    >
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF3EC', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
        <Ionicons name={icon} size={20} color={ORANGE} />
      </View>
      <Text style={{ flex: 1, fontWeight: '700' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#111" />
    </TouchableOpacity>
  );
}
