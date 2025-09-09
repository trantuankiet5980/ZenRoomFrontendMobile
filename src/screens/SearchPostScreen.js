import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SortModal from "../components/modal/SortModal";
import PriceRangeModal from "../components/modal/PriceRangeModal";

const ORANGE = '#f36031';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

const mockData = [
  {
    id: '1',
    title: 'PHÒNG CHO THUÊ DẠNG CHUNG CƯ GIÁ RẺ TẠI GÒ VẤP',
    price: 3500000,
    address: '12, Nguyễn Văn Nghi, Quận Gò Vấp',
    remain: 'Còn trống: 1 phòng',
    image: 'https://picsum.photos/seed/room1/400/300',
  },
  {
    id: '2',
    title: 'PHÒNG NGUYÊN CĂN GIÁ RẺ TẠI BÌNH THẠNH',
    price: 5500000,
    address: '45, Bạch Đằng, Quận Bình Thạnh',
    remain: 'Còn trống: 2 phòng',
    image: 'https://picsum.photos/seed/room2/400/300',
  },
  {
    id: '3',
    title: 'CĂN HỘ MINI FULL NỘI THẤT QUẬN 1',
    price: 12000000,
    address: '34, Lê Lợi, Quận 1',
    remain: 'Còn trống: 1 phòng',
    image: 'https://picsum.photos/seed/room3/400/300',
  },
  {
    id: '4',
    title: 'PHÒNG TRỌ SINH VIÊN GIÁ RẺ QUẬN 9',
    price: 2000000,
    address: '78, Đỗ Xuân Hợp, TP Thủ Đức',
    remain: 'Còn trống: 3 phòng',
    image: 'https://picsum.photos/seed/room4/400/300',
  },
];

export default function SearchPostScreen() {
  const [activeType, setActiveType] = useState('Phòng trọ');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  const [data, setData] = useState(mockData);

  const renderItem = ({ item }) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: GRAY,
      overflow: 'hidden',
      flex: 1,
      margin: 6,
    }}>
      <Image source={{ uri: item.image }} style={{ height: 120, width: '100%' }} />
      <View style={{ padding: 8 }}>
        <Text numberOfLines={2} style={{ fontWeight: '700', fontSize: 13 }}>
          {item.title}
        </Text>
        <Text style={{ color: ORANGE, fontWeight: '600', fontSize: 12, marginTop: 4 }}>
          {`Từ ${item.price.toLocaleString()}đ/tháng`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="location" size={14} color={ORANGE} />
          <Text style={{ fontSize: 11, color: '#111', marginLeft: 4 }} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
          {item.remain}
        </Text>
      </View>
    </View>
  );

  // Lọc theo khoảng giá
  const filteredData = data.filter(
    (item) => item.price >= priceRange[0] && item.price <= priceRange[1]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Search box */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        margin: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        height: 40,
      }}>
        <Ionicons name="search" size={20} color={TEXT_MUTED} />
        <TextInput
          placeholder="Nhập tiêu đề tin đăng"
          placeholderTextColor={TEXT_MUTED}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>

      {/* Filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', height: 35 }}
      >
        <Pressable
          onPress={() => setSortModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
        >
          <Text style={{ fontWeight: '600' }}>Sắp xếp theo</Text>
          <Ionicons name="chevron-down" size={16} />
        </Pressable>
        <Pressable
          onPress={() => setPriceModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
        >
          <Text style={{ fontWeight: '600' }}>Khoảng giá</Text>
          <Ionicons name="chevron-down" size={16} />
        </Pressable>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
          <Ionicons name="filter" size={16} />
          <Text style={{ fontWeight: '600', marginLeft: 4 }}>Lọc</Text>
        </Pressable>
      </ScrollView>

      {/* Types */}
      <View style={{ flexDirection: 'row', marginHorizontal: 12, marginTop: 10, marginBottom: 6 }}>
        {['Phòng trọ', 'Nguyên căn', 'Chung cư'].map((t) => (
          <Pressable
            key={t}
            onPress={() => setActiveType(t)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: activeType === t ? ORANGE : GRAY,
              backgroundColor: activeType === t ? '#FEE6C9' : '#fff',
              marginRight: 8,
            }}
          >
            <Text style={{ color: activeType === t ? ORANGE : '#111' }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Location */}
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 12 }}>
        <Ionicons name="location-sharp" size={16} color={ORANGE} />
        <Text style={{ fontWeight: '600', marginLeft: 4 }}>Khu vực: Thành phố Hồ Chí Minh</Text>
        <Ionicons name="chevron-down" size={16} />
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 80 }}
      />

      {/* Map button */}
      <Pressable
        style={{
          position: 'absolute',
          bottom: 30,
          alignSelf: 'center',
          flexDirection: 'row',
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: ORANGE,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 999,
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Ionicons name="map" size={18} color={ORANGE} />
        <Text style={{ color: ORANGE, fontWeight: '700' }}>Bản đồ</Text>
      </Pressable>

      {/* Modals */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        onSort={(type) => {
          if (type === "desc") {
            setData([...data].sort((a, b) => b.price - a.price));
          } else {
            setData([...data].sort((a, b) => a.price - b.price));
          }
          setSortModalVisible(false);
        }}
      />

      <PriceRangeModal
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
    </View>
  );
}
