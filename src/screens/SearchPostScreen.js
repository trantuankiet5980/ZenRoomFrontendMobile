import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
import { fetchDistricts, fetchProvinces } from "../features/administrative/administrativeThunks";
import {
  addSearchHistory as addSearchHistoryThunk,
  clearSearchHistory as clearSearchHistoryThunk,
  deleteSearchHistory as deleteSearchHistoryThunk,
  fetchSearchHistory,
} from "../features/searchHistory/searchHistoryThunks";
import { ADMIN_ALL_LABEL, ADMIN_ALL_VALUE, isAllAdministrativeValue } from "../constants/administrative";
import { clearDistricts } from "../features/administrative/administrativeSlice";
import * as Location from "expo-location";
import { showToast } from "../utils/AppUtils";

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
  const initialProvince = routeProvinceCode || ADMIN_ALL_VALUE;
  const initialDistrict = routeDistrictCode || ADMIN_ALL_VALUE;
  const [selectedCity, setSelectedCity] = useState(initialProvince);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [historySize, setHistorySize] = useState(3);
  const [isLocating, setIsLocating] = useState(false);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const { searchResults, loading } = useSelector((s) => s.properties);
  const searchHistoryState = useSelector((s) => s.searchHistory);
  const historyItems = searchHistoryState.items || [];

  const selectedCityName = isAllAdministrativeValue(selectedCity)
    ? ADMIN_ALL_LABEL
    : provinces.find(p => p.code === selectedCity)?.name_with_type || selectedCity;
  const selectedDistrictName = isAllAdministrativeValue(selectedDistrict)
    ? ADMIN_ALL_LABEL
    : districts.find(d => d.code === selectedDistrict)?.name_with_type;

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
  };

  const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

  const buildFiltersPayload = useCallback(() => {
    const raw = {
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      provinceCode: isAllAdministrativeValue(selectedCity)
        ? undefined
        : selectedCity,
      districtCode: isAllAdministrativeValue(selectedDistrict)
        ? undefined
        : selectedDistrict,
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
    dispatch(fetchProvinces());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSearchHistory({ page: 0, size: historySize }));
  }, [dispatch, historySize]);

  useEffect(() => {
    if (isAllAdministrativeValue(selectedCity)) {
      dispatch(clearDistricts());
      return;
    }
    dispatch(fetchDistricts(selectedCity));
  }, [dispatch, selectedCity]);

  useEffect(() => {
    if (routeProvinceCode && !isAllAdministrativeValue(routeProvinceCode)) {
      dispatch(fetchDistricts(routeProvinceCode));
    }
  }, [dispatch, routeProvinceCode]);

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

  const normalizeText = useCallback((text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  }, []);

  const handleUseLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      if (!provinces || provinces.length === 0) {
        showToast(
          "error",
          "top",
          "Thông báo",
          "Danh sách tỉnh/thành phố đang được tải. Vui lòng thử lại sau."
        );
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(
          "error",
          "top",
          "Thông báo",
          "Vui lòng cấp quyền truy cập vị trí để sử dụng chức năng này."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (!place) {
        showToast("error", "top", "Thông báo", "Không xác định được vị trí hiện tại.");
        return;
      }

      const locationTokens = [
        place.city,
        place.region,
        place.subregion,
        place.district,
        place.province,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .filter(Boolean);

      const matchedProvince = provinces.find((province) => {
        const provinceTokens = [
          normalizeText(province.name_with_type),
          normalizeText(province.name),
        ].filter(Boolean);
        return provinceTokens.some((provinceToken) =>
          locationTokens.some(
            (token) =>
              provinceToken.includes(token) || token.includes(provinceToken)
          )
        );
      });

      if (!matchedProvince) {
        showToast(
          "error",
          "top",
          "Thông báo",
          "Không tìm thấy tỉnh/thành phố phù hợp với vị trí hiện tại."
        );
        return;
      }

      setSelectedCity(matchedProvince.code);
      setSelectedDistrict(ADMIN_ALL_VALUE);
      const districtsData = await dispatch(
        fetchDistricts(matchedProvince.code)
      ).unwrap();

      const districtTokens = [
        place.subregion,
        place.district,
        place.city,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .filter(Boolean);

      const matchedDistrict = districtsData?.find((district) => {
        const districtToken = normalizeText(district.name_with_type);
        return districtTokens.some(
          (token) =>
            districtToken.includes(token) || token.includes(districtToken)
        );
      });

      if (matchedDistrict) {
        setSelectedDistrict(matchedDistrict.code);
      }
    } catch (error) {
      showToast(
        "error",
        "top",
        "Thông báo",
        "Không thể lấy vị trí hiện tại. Vui lòng thử lại sau."
      );
    } finally {
      setIsLocating(false);
    }
  }, [dispatch, normalizeText, provinces]);

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
    if (isAllAdministrativeValue(provinceCode)) {
      setSelectedCity(ADMIN_ALL_VALUE);
      setSelectedDistrict(ADMIN_ALL_VALUE);
      setCityModalVisible(false);
      dispatch(clearDistricts());
      return;
    }
    setSelectedCity(provinceCode);
    setSelectedDistrict(ADMIN_ALL_VALUE);
    setCityModalVisible(false);
  };

  const handleSelectDistrict = (districtCode) => {
    if (isAllAdministrativeValue(districtCode)) {
      setSelectedDistrict(ADMIN_ALL_VALUE);
    } else {
      setSelectedDistrict(districtCode);
    }
    setDistrictModalVisible(false);
  };

  const disableDistrictSelect = isAllAdministrativeValue(selectedCity);

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

      {/* City / District selectors */}
      <View style={{ paddingHorizontal: 12, marginTop: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setCityModalVisible(true)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f4f4f4',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Ionicons name="location-outline" size={18} color="#333" />
            <Text style={{ marginLeft: 6, fontSize: 14 }}>
              {selectedCityName || 'Chọn Tỉnh/Thành phố'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!disableDistrictSelect) {
                setDistrictModalVisible(true);
              }
            }}
            disabled={disableDistrictSelect}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f4f4f4',
              padding: 10,
              borderRadius: 8,
              opacity: disableDistrictSelect ? 0.5 : 1,
            }}
          >
            <Ionicons name="business-outline" size={18} color="#333" />
            <Text style={{ marginLeft: 6, fontSize: 14 }}>
              {disableDistrictSelect
                ? ADMIN_ALL_LABEL
                : selectedDistrictName || 'Chọn Quận/Huyện'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleUseLocation}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="navigate-circle-outline" size={18} color={ORANGE} />
          <Text style={{ color: ORANGE, fontWeight: '600' }}>
            Sử dụng vị trí của tôi
          </Text>
          {isLocating && <ActivityIndicator size="small" color={ORANGE} />}
        </TouchableOpacity>
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
