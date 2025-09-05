import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const TAB_ACTIVE = '#f36031';

export default function InventoryRoomsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('empty'); // 'empty' (chưa cho thuê) | 'renting' (đang cho thuê)

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Phòng trọ</Text>
      </View>

      {/* Search */}
      <View style={{ margin: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput placeholder="Nhập tên phòng trọ" placeholderTextColor="#9CA3AF" style={{ marginLeft: 8, flex: 1 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 18 }}>
        <TabButton label="Chưa cho thuê" active={tab === 'empty'} onPress={() => setTab('empty')} />
        <TabButton label="Đang cho thuê" active={tab === 'renting'} onPress={() => setTab('renting')} />
      </View>
      <View style={{ height: 2, backgroundColor: '#E5E7EB', marginTop: 8 }} />

      {/* Content */}
      {tab === 'empty' ? (
        <EmptyRooms
          image={require('../../assets/images/empty_building.jpg')}
          title="Bạn chưa có phòng nào"
          subtitle="Nhấn nút thêm phòng ngay để dễ dàng đăng bài cho thuê và vận hành hàng tháng nhé."
        />
      ) : (
        <EmptyRooms
          image={require('../../assets/images/empty_building.jpg')}
          title="Chưa có phòng đang cho thuê"
          subtitle="Khi có phòng đang cho thuê, chúng sẽ hiển thị ở đây."
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateRoom')}
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

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10 }}>
      <Text style={{ fontWeight: '700', color: active ? TAB_ACTIVE : '#9CA3AF' }}>{label}</Text>
      <View style={{
        height: 3, marginTop: 8,
        backgroundColor: active ? TAB_ACTIVE : 'transparent', borderRadius: 2
      }}/>
    </TouchableOpacity>
  );
}

function EmptyRooms({ image, title, subtitle }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <Image source={image} style={{ width: 220, height: 220, resizeMode: 'contain' }} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111', marginTop: 8 }}>{title}</Text>
      <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 6 }}>{subtitle}</Text>
    </View>
  );
}
