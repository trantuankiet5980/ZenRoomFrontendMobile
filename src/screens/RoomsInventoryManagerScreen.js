import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const cardStyle = {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
};

export default function RoomsInventoryManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Quản lý kho phòng</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('InventoryBuildings')} activeOpacity={0.85}>
        <ImageBackground
          source={require('../../assets/images/inventory_building.jpg')}
          style={cardStyle}
          imageStyle={{ transform: [{ scale: 1.02 }] }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 }}>TÒA NHÀ</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('InventoryRooms')} activeOpacity={0.85}>
        <ImageBackground
          source={require('../../assets/images/inventory_room.jpg')}
          style={cardStyle}
          imageStyle={{ transform: [{ scale: 1.02 }] }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 }}>PHÒNG ĐƠN</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}
