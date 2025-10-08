import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from "react-redux";
import { searchProperties } from "../features/properties/propertiesThunks";
import SortModal from "../components/modal/SortModal";
import PriceRangeModal from "../components/modal/PriceRangeModal";
import FilterModal from "../components/modal/FilterModal";
import useHideTabBar from '../hooks/useHideTabBar';
import { useNavigation, useRoute } from "@react-navigation/native";
import S3Image from "../components/S3Image";
import SelectCityModal from "../components/modal/SelectCityModal";
import SelectDistrictModal from "../components/modal/SelectDistrictModal";
import { fetchDistricts } from "../features/administrative/administrativeThunks";

const ORANGE = '#f36031';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function SearchPostScreen() {
  useHideTabBar();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { provinceCode: routeProvinceCode, districtCode: routeDistrictCode } = route.params || {};

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState(routeProvinceCode || null);
  const [selectedDistrict, setSelectedDistrict] = useState(routeDistrictCode || null);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const { searchResults, loading } = useSelector((s) => s.properties);

  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name_with_type || selectedCity;
  const selectedDistrictName = districts.find(d => d.code === selectedDistrict)?.name_with_type;

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
  };

  const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

  // gọi API mỗi khi keyword / priceRange thay đổi
  useEffect(() => {
    dispatch(searchProperties({
      keyword: searchKeyword || undefined,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      propertyType: "BUILDING",
      postStatus: "APPROVED",
      page: 0,
      size: 20,
      provinceCode: selectedCity,
      districtCode: selectedDistrict,
    }));
  }, [dispatch, searchKeyword, priceRange, selectedCity, selectedDistrict]);

  const renderItem = ({ item }) => {
    const priceUnit = "ngày";
    return (
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
        <S3Image
          src={item.media?.[0]?.url || "https://picsum.photos/seed/building/600/400"}
          cacheKey={item.updatedAt}
          style={{ width: "100%", height: 120, borderRadius: 8 }}
          alt={item.title}
        />
        <View style={{ padding: 8 }}>
          <Text numberOfLines={2} style={{ fontWeight: '700', fontSize: 13 }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 12, color: ORANGE }}>
            Từ {formatPrice(item.price)}đ/{priceUnit}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location" size={14} color={ORANGE} />
            <Text style={{ fontSize: 11, color: '#111', marginLeft: 4 }} numberOfLines={1}>
              {formatAddress(item.address.addressFull)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // handler áp dụng filter nâng cao
  const handleApplyFilters = (filters) => {
    dispatch(searchProperties({
      keyword: searchKeyword || undefined,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      propertyType: "BUILDING",
      postStatus: "APPROVED",
      page: 0,
      size: 20,
      provinceCode: selectedCity,
      districtCode: selectedDistrict,
      ...filters,
    }));
    setFilterModalVisible(false);
  };

  const handleSelectCity = (provinceCode) => {
    setSelectedCity(provinceCode);
    setSelectedDistrict(null); // reset district khi đổi tỉnh
    dispatch(fetchDistricts(provinceCode));
    setCityModalVisible(false);
  };

  const handleSelectDistrict = (districtCode) => {
    setSelectedDistrict(districtCode);
    setDistrictModalVisible(false);
  };

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
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
      </View>

      {/* Filter row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, alignItems: 'center', height: 35 }}>
        <Pressable
          onPress={() => setSortModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: GRAY, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>Sắp xếp theo</Text>
          <Ionicons name="chevron-down" size={16} />
        </Pressable>

        <Pressable
          onPress={() => setPriceModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: GRAY, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>Khoảng giá</Text>
          <Ionicons name="chevron-down" size={16} />
        </Pressable>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: GRAY, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Ionicons name="filter" size={16} />
          <Text style={{ fontWeight: '600', marginLeft: 4 }}>Lọc</Text>
        </Pressable>
      </View>

      {/* Location button dưới hàng filter */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, alignItems: 'center', marginTop: 6, height: 35 }}>
        <Pressable
          onPress={() => setCityModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: GRAY, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>
            {selectedDistrictName
              ? `${selectedDistrictName}, ${selectedCityName}`
              : `Khu vực: ${selectedCityName || "Chọn tỉnh"}`}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 4 }} />
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Đang tải...</Text>
      ) : (
        <FlatList
          data={searchResults?.content || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.propertyId}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 6,
            paddingBottom: 80,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40, color: TEXT_MUTED }}>
              Không tìm thấy kết quả phù hợp
            </Text>
          }
        />
      )}

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
        onPress={() => navigation.navigate('MapScreen', { activeType: "Căn hộ" })}
      >
        <Ionicons name="map" size={18} color={ORANGE} />
        <Text style={{ color: ORANGE, fontWeight: '700' }}>Bản đồ</Text>
      </TouchableOpacity>

      {/* Modals */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        onSort={(type) => {
          const sorted = [...(searchResults?.content || [])].sort((a, b) =>
            type === "desc" ? b.price - a.price : a.price - b.price
          );
          dispatch({ type: "properties/search/fulfilled", payload: { ...searchResults, content: sorted } });
          setSortModalVisible(false);
        }}
      />
      <PriceRangeModal
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
      <SelectCityModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        provinces={provinces}
        onSelectCity={handleSelectCity}
      />
      <SelectDistrictModal
        visible={districtModalVisible}
        onClose={() => setDistrictModalVisible(false)}
        districts={districts}
        onSelectDistrict={handleSelectDistrict}
      />
    </View>
  );
}
