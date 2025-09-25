import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Image, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from "react-redux";
import { fetchProperties } from "../features/properties/propertiesThunks";
import SortModal from "../components/modal/SortModal";
import PriceRangeModal from "../components/modal/PriceRangeModal";
import useHideTabBar from '../hooks/useHideTabBar';
import { useNavigation } from "@react-navigation/native";

const ORANGE = '#f36031';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function SearchPostScreen() {
  const [activeType, setActiveType] = useState('Phòng trọ');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  useHideTabBar();
  const navigation = useNavigation();

  const [searchKeyword, setSearchKeyword] = useState("");


  const dispatch = useDispatch();
  const { rooms, buildings, loading } = useSelector((state) => state.properties);

  // fetch lần đầu
  useEffect(() => {
    dispatch(fetchProperties({ page: 0, size: 20, type: "ROOM", postStatus: "APPROVED" }));
  }, [dispatch]);

  // chọn loại (ROOM / BUILDING) dựa vào activeType
  useEffect(() => {
    if (activeType === "Phòng trọ") {
      dispatch(fetchProperties({ page: 0, size: 20, type: "ROOM", postStatus: "APPROVED" }));
    } else if (activeType === "Nguyên căn" || activeType === "Chung cư") {
      dispatch(fetchProperties({ page: 0, size: 20, type: "BUILDING", postStatus: "APPROVED" }));
    }
  }, [activeType, dispatch]);

  // chọn data theo loại
  const data = activeType === "Phòng trọ" ? rooms : buildings;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.propertyId })}
      style={{
        width: '48%',
        margin: 6,
        borderWidth: 1,
        borderColor: GRAY,
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Image
        source={{ uri: item.media?.[0]?.url || "https://picsum.photos/seed/building/600/400" }}
        style={{ width: "100%", height: 120 }}
        resizeMode="cover"
      />
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
            {item.address?.addressFull || "Đang cập nhật"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Lọc theo khoảng giá
  const filteredData = data.filter(
    (item) => item.price >= priceRange[0] && item.price <= priceRange[1] && item.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ marginHorizontal: 12, marginTop: 12 }}>
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
            value={searchKeyword}
            onChangeText={setSearchKeyword}
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
      </View>

      {/* Types */}
      <View style={{ flexDirection: 'row', marginHorizontal: 12, marginTop: 10, marginBottom: 6 }}>
        {['Phòng trọ', 'Căn hộ'].map((t) => (
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

      {/* List */}
      {
        loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Đang tải...</Text>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.propertyId}
            numColumns={2}
            contentContainerStyle={{
              paddingHorizontal: 6,
              paddingBottom: 80,
              flexGrow: 1,
            }}
          />
        )
      }

      {/* Map button */}
      <TouchableOpacity
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
        onPress={() => navigation.navigate('MapScreen', { activeType })}
      >
        <Ionicons name="map" size={18} color={ORANGE} />
        <Text style={{ color: ORANGE, fontWeight: '700' }}>Bản đồ</Text>
      </TouchableOpacity>

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
    </View >
  );
}
