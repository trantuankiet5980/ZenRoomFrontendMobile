import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  addSearchHistory as addSearchHistoryThunk,
  clearSearchHistory as clearSearchHistoryThunk,
  deleteSearchHistory as deleteSearchHistoryThunk,
  fetchSearchHistory,
} from "../features/searchHistory/searchHistoryThunks";

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
  const [lastSearchKeyword, setLastSearchKeyword] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const shouldRefreshHistoryRef = useRef(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState(routeProvinceCode || null);
  const [selectedDistrict, setSelectedDistrict] = useState(routeDistrictCode || null);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [historySize, setHistorySize] = useState(3);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const { searchResults, loading } = useSelector((s) => s.properties);
  const searchHistoryState = useSelector((s) => s.searchHistory);
  const historyItems = searchHistoryState.items || [];

  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name_with_type || selectedCity;
  const selectedDistrictName = districts.find(d => d.code === selectedDistrict)?.name_with_type;

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
  };

  const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

  const buildFiltersPayload = useCallback(() => {
    const raw = {
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      provinceCode: selectedCity,
      districtCode: selectedDistrict,
      ...appliedFilters,
    };

    const cleaned = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [priceRange, selectedCity, selectedDistrict, appliedFilters]);

  useEffect(() => {
    dispatch(fetchSearchHistory({ page: 0, size: historySize }));
  }, [dispatch, historySize]);

  useEffect(() => {
    let isActive = true;
    const filters = buildFiltersPayload();
    const params = {
      keyword: lastSearchKeyword || undefined,
      propertyType: "BUILDING",
      postStatus: "APPROVED",
      page: 0,
      size: 20,
      ...filters,
    };

    const runSearch = async () => {
      try {
        await dispatch(searchProperties(params)).unwrap();
        if (!isActive) return;

        if (shouldRefreshHistoryRef.current && lastSearchKeyword) {
          try {
            await dispatch(
              addSearchHistoryThunk({
                keyword: lastSearchKeyword,
                filters,
              })
            ).unwrap();
          } catch (error) {
            // ignore add history errors
          }

          if (!isActive) return;
          dispatch(fetchSearchHistory({ page: 0, size: 3 }));
        }
      } catch (error) {
        // ignore search errors
      } finally {
        if (isActive) {
          shouldRefreshHistoryRef.current = false;
        }
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [dispatch, buildFiltersPayload, lastSearchKeyword, searchTrigger]);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchKeyword.trim();
    setSearchKeyword(trimmed);
    setLastSearchKeyword(trimmed);
    setSearchTrigger((prev) => prev + 1);
    if (historySize !== 3) {
      setHistorySize(3);
    }
    shouldRefreshHistoryRef.current = Boolean(trimmed);
  }, [historySize, searchKeyword]);

  const handleSelectHistoryKeyword = useCallback((keyword) => {
    setSearchKeyword(keyword);
    setLastSearchKeyword(keyword);
    setSearchTrigger((prev) => prev + 1);
    if (historySize !== 3) {
      setHistorySize(3);
    }
    shouldRefreshHistoryRef.current = Boolean(keyword);
  }, [historySize]);

  const handleDeleteHistory = useCallback((searchId) => {
    dispatch(deleteSearchHistoryThunk(searchId))
      .unwrap()
      .finally(() => {
        dispatch(fetchSearchHistory({ page: 0, size: historySize }));
      });
  }, [dispatch, historySize]);

  const handleClearHistory = useCallback(() => {
    dispatch(clearSearchHistoryThunk())
      .unwrap()
      .finally(() => {
        setHistorySize(3);
        dispatch(fetchSearchHistory({ page: 0, size: 3 }));
      });
  }, [dispatch]);

  const handleLoadMoreHistory = useCallback(() => {
    setHistorySize((prev) => prev + 10);
  }, []);

  const displayedHistory = useMemo(() => {
    return historyItems.slice(0, historySize);
  }, [historyItems, historySize]);

  const canLoadMoreHistory = useMemo(() => {
    const total = searchHistoryState.total || 0;
    return total > historySize;
  }, [searchHistoryState.total, historySize]);

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
    setAppliedFilters(filters || {});
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
        margin: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TextInput
          placeholder="Nhập tiêu đề tin đăng"
          placeholderTextColor={TEXT_MUTED}
          style={{ flex: 1, marginRight: 12 }}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        <Pressable
          onPress={handleSearchSubmit}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: ORANGE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Search history */}
      <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Lịch sử tìm kiếm</Text>
          {historyItems.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={{ color: ORANGE, fontWeight: '600' }}>Xóa lịch sử tìm kiếm</Text>
            </TouchableOpacity>
          )}
        </View>
        {searchHistoryState.loading && historyItems.length === 0 ? (
          <Text style={{ marginTop: 12, color: TEXT_MUTED }}>Đang tải lịch sử...</Text>
        ) : displayedHistory.length === 0 ? (
          <Text style={{ marginTop: 12, color: TEXT_MUTED }}>Chưa có lịch sử tìm kiếm</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            {displayedHistory.map((history) => (
              <View
                key={history.searchId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f0f0f0',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <TouchableOpacity onPress={() => handleSelectHistoryKeyword(history.keyword)}>
                  <Text style={{ fontWeight: '600', marginRight: 6 }}>{history.keyword}</Text>
                </TouchableOpacity>
                <Pressable onPress={() => handleDeleteHistory(history.searchId)}>
                  <Ionicons name="close" size={16} color={TEXT_MUTED} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {canLoadMoreHistory && (
          <TouchableOpacity
            onPress={handleLoadMoreHistory}
            style={{ marginTop: 4 }}
          >
            <Text style={{ color: ORANGE, fontWeight: '600' }}>Hiển thị thêm tìm kiếm</Text>
          </TouchableOpacity>
        )}
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
