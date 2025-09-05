import React from 'react';
import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

export default function InventoryBuildingsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Tòa nhà</Text>
      </View>

      {/* Search */}
      <View style={{ margin: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput placeholder="Nhập tên tòa nhà" placeholderTextColor="#9CA3AF" style={{ marginLeft: 8, flex: 1 }} />
      </View>

      {/* Empty state */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Image source={require('../../assets/images/empty_building.jpg')} style={{ width: 220, height: 220, resizeMode: 'contain' }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111', marginTop: 8 }}>Bạn chưa có tòa nhà nào</Text>
        <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 6 }}>
          Nhấn nút thêm tòa nhà để dễ dàng đăng bài cho thuê và vận hành hàng tháng nhé.
        </Text>
      </View>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateBuilding')}
        style={{
          position: 'absolute', right: 20, bottom: 20 + insets.bottom,
          width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
