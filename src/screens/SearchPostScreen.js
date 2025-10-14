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
import { fetchSearchSuggestions, logSearchSuggestionEvent } from "../features/searchSuggestions/searchSuggestionsThunks";
import { clearSearchSuggestions } from "../features/searchSuggestions/searchSuggestionsSlice";
import * as Location from "expo-location";
import { showToast } from "../utils/AppUtils";
import { fetchAfterSearchRecommendations } from "../features/recommendations/recommendationsThunks";
import { recordUserEvent } from "../features/events/eventsThunks";
import { resolvePropertyTitle, resolvePropertyName } from "../utils/propertyDisplay";

const ORANGE = '#f36031';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';
const SUGGESTION_LIMIT = 10;

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
  const searchInputRef = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestionsOverlay, setShowSuggestionsOverlay] = useState(false);
  const [searchBoxBottom, setSearchBoxBottom] = useState(null);
  const [historyTop, setHistoryTop] = useState(null);

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
  const afterSearchState =
    useSelector((s) => s.recommendations?.afterSearch) || {};
  const {
    items: afterSearchRecommendations = [],
    loading: afterSearchLoading = false,
    error: afterSearchError = null,
  } = afterSearchState;
  const shouldShowAfterSearchFooter = useMemo(
    () =>
      Boolean(afterSearchError) ||
      afterSearchLoading ||
      (Array.isArray(afterSearchRecommendations) && afterSearchRecommendations.length > 0),
    [afterSearchError, afterSearchLoading, afterSearchRecommendations]
  );
  const afterSearchFooterStyle = useMemo(
    () => (shouldShowAfterSearchFooter ? { marginTop: 24 } : null),
    [shouldShowAfterSearchFooter]
  );
  const searchHistoryState = useSelector((s) => s.searchHistory);
  const historyItems = searchHistoryState.items || [];
  const searchSuggestionsState = useSelector((s) => s.searchSuggestions);
  const suggestionItems = searchSuggestionsState.items || [];
  const suggestionsLoading = searchSuggestionsState.loading;
  const suggestionsError = searchSuggestionsState.error;

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
    const trimmedKeyword = searchKeyword.trim();
    if (!isSearchFocused || trimmedKeyword.length === 0) {
      setShowSuggestionsOverlay(false);
      dispatch(clearSearchSuggestions());
      return;
    }

    setShowSuggestionsOverlay(true);
    const handler = setTimeout(() => {
      dispatch(fetchSearchSuggestions({ query: trimmedKeyword, limit: SUGGESTION_LIMIT }));
    }, 300);

    return () => clearTimeout(handler);
  }, [dispatch, searchKeyword, isSearchFocused]);

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

        const normalizedQuery = (lastSearchKeyword || "").trim();
        dispatch(
          fetchAfterSearchRecommendations({ query: normalizedQuery })
        );

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

  const submitSearch = useCallback(
    (keywordOverride, { logQueryEvent = true } = {}) => {
      const rawKeyword =
        typeof keywordOverride === "string" ? keywordOverride : searchKeyword;
      const trimmed = rawKeyword.trim();

      setSearchKeyword(trimmed);
      setLastSearchKeyword(trimmed);
      setSearchTrigger((prev) => prev + 1);
      if (historySize !== 3) {
        setHistorySize(3);
      }
      shouldRefreshHistoryRef.current = Boolean(trimmed);
      setShowSuggestionsOverlay(false);
      dispatch(clearSearchSuggestions());
      setIsSearchFocused(false);
      searchInputRef.current?.blur?.();
      if (trimmed && logQueryEvent) {
        dispatch(logSearchSuggestionEvent({ type: "QUERY", query: trimmed }));
        dispatch(
          recordUserEvent({
            eventType: "SEARCH",
            query: trimmed,
            metadata: { source: "search_screen" },
          })
        );
      }

      return trimmed;
    },
    [dispatch, historySize, searchKeyword]
  );

  const handleSearchSubmit = useCallback(() => {
    submitSearch();
  }, [submitSearch]);

  const handleSelectHistoryKeyword = useCallback((keyword) => {
    const normalized = (keyword || "").trim();
    setSearchKeyword(normalized);
    setLastSearchKeyword(normalized);
    setSearchTrigger((prev) => prev + 1);
    if (historySize !== 3) {
      setHistorySize(3);
    }
    shouldRefreshHistoryRef.current = Boolean(normalized);
    if (normalized) {
      dispatch(
        recordUserEvent({
          eventType: "SEARCH",
          query: normalized,
          metadata: { source: "search_history" },
        })
      );
    }
  }, [dispatch, historySize]);

  const handleSelectSuggestionKeyword = useCallback(
    (item) => {
      const keyword = item?.keyword?.trim?.();
      if (!keyword) {
        return;
      }

      const typedQuery = searchKeyword.trim();
      submitSearch(keyword);

      if (typedQuery || keyword) {
        dispatch(
          logSearchSuggestionEvent({
            type: "CLICK",
            query: typedQuery || keyword,
            suggestionId: item?.suggestionId,
          })
        );
      }
    },
    [dispatch, searchKeyword, submitSearch]
  );

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

  const buildTokenSet = useCallback(
    (values = []) => {
      const tokenSet = new Set();
      values
        .filter(Boolean)
        .map(normalizeText)
        .filter(Boolean)
        .forEach((token) => {
          tokenSet.add(token);
          const compactToken = token.replace(/\s+/g, "");
          if (compactToken) {
            tokenSet.add(compactToken);
          }
        });
      return Array.from(tokenSet);
    },
    [normalizeText]
  );

  const suggestionKeywords = useMemo(() => {
    if (!Array.isArray(suggestionItems) || suggestionItems.length === 0) {
      return [];
    }

    const normalizedQuery = normalizeText(searchKeyword);
    if (!normalizedQuery) {
      return [];
    }

    const normalizedQueryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const seenKeywords = new Set();
    const sortedSuggestions = [...suggestionItems].sort(
      (a, b) => (b?.score ?? 0) - (a?.score ?? 0)
    );

    const keywordList = [];

    for (const suggestion of sortedSuggestions) {
      if (!suggestion) {
        continue;
      }

      const rawKeywords = [];

      if (typeof suggestion.keywords === "string") {
        rawKeywords.push(
          ...suggestion.keywords
            .split("|")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        );
      } else if (Array.isArray(suggestion.keywords)) {
        rawKeywords.push(
          ...suggestion.keywords
            .map((keyword) =>
              typeof keyword === "string" ? keyword.trim() : ""
            )
            .filter(Boolean)
        );
      }

      if (rawKeywords.length === 0) {
        continue;
      }

      const keywordsWithMeta = rawKeywords
        .map((keyword) => {
          const normalizedKeyword = normalizeText(keyword);
          if (!normalizedKeyword) {
            return null;
          }

          const keywordTokens = normalizedKeyword.split(/\s+/).filter(Boolean);
          const normalizedKeywordCompact = keywordTokens.join("");
          const keywordJoined = keywordTokens.join(" ");

          const fullPrefixMatch = normalizedKeyword.startsWith(normalizedQuery);
          const fullContainsMatch = normalizedKeyword.includes(normalizedQuery);

          const tokenPrefixIndex = keywordTokens.findIndex((token) =>
            normalizedQueryTokens.some((queryToken) =>
              token.startsWith(queryToken)
            )
          );

          const tokenContainsIndex = keywordTokens.findIndex((token) =>
            normalizedQueryTokens.some((queryToken) => token.includes(queryToken))
          );

          return {
            keyword: keyword.replace(/\s+/g, " ").trim(),
            normalizedKeyword,
            normalizedKeywordCompact,
            keywordJoined,
            fullPrefixMatch,
            fullContainsMatch,
            tokenPrefixIndex: tokenPrefixIndex === -1
              ? Number.MAX_SAFE_INTEGER
              : tokenPrefixIndex,
            tokenContainsIndex: tokenContainsIndex === -1
              ? Number.MAX_SAFE_INTEGER
              : tokenContainsIndex,
          };
        })
        .filter(Boolean);

      keywordsWithMeta.sort((a, b) => {
        const fullPrefixDelta = Number(b.fullPrefixMatch) - Number(a.fullPrefixMatch);
        if (fullPrefixDelta !== 0) {
          return fullPrefixDelta;
        }

        const tokenPrefixDelta = a.tokenPrefixIndex - b.tokenPrefixIndex;
        if (tokenPrefixDelta !== 0) {
          return tokenPrefixDelta;
        }

        const tokenContainsDelta = a.tokenContainsIndex - b.tokenContainsIndex;
        if (tokenContainsDelta !== 0) {
          return tokenContainsDelta;
        }

        const fullContainsDelta = Number(b.fullContainsMatch) - Number(a.fullContainsMatch);
        if (fullContainsDelta !== 0) {
          return fullContainsDelta;
        }

        if (a.keywordJoined.length !== b.keywordJoined.length) {
          return a.keywordJoined.length - b.keywordJoined.length;
        }

        return a.keyword.localeCompare(b.keyword, "vi", { sensitivity: "base" });
      });

      const selectedKeyword = keywordsWithMeta.find(
        (keywordMeta) => !seenKeywords.has(keywordMeta.normalizedKeywordCompact)
      );

      if (!selectedKeyword) {
        continue;
      }

      seenKeywords.add(selectedKeyword.normalizedKeywordCompact);
      keywordList.push({
        keyword: selectedKeyword.keyword,
        suggestionId: suggestion.suggestionId,
        normalizedKeyword: selectedKeyword.normalizedKeywordCompact,
      });

      if (keywordList.length >= SUGGESTION_LIMIT) {
        break;
      }
    }

    return keywordList;
  }, [normalizeText, searchKeyword, suggestionItems]);

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

      const locationTokens = buildTokenSet([
        place.city,
        place.region,
        place.subregion,
        place.district,
        place.province,
      ]);

      const matchedProvince = provinces.find((province) => {
        const provinceTokens = buildTokenSet([
          province.name_with_type,
          province.name,
        ]);
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

      const districtTokens = buildTokenSet([
        place.subregion,
        place.district,
        place.city,
      ]);

      const matchedDistrict = districtsData?.find((district) => {
        const districtTokensNormalized = buildTokenSet([
          district.name_with_type,
        ]);
        return districtTokens.some(
          (token) =>
            districtTokensNormalized.some(
              (districtToken) =>
                districtToken.includes(token) || token.includes(districtToken)
            )
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
  }, [buildTokenSet, dispatch, provinces]);

  const renderSuggestionItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => handleSelectSuggestionKeyword(item)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
          {item.keyword}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelectSuggestionKeyword]
  );

  const openPropertyDetail = useCallback(
    (propertyId, metadata = {}) => {
      if (!propertyId) {
        return;
      }

      const normalizedMetadata =
        metadata && Object.keys(metadata).length > 0 ? metadata : undefined;

      dispatch(
        recordUserEvent({
          eventType: "VIEW",
          roomId: propertyId,
          metadata: normalizedMetadata,
        })
      );

      navigation.navigate('PropertyDetail', {
        propertyId,
        loggedViewEvent: true,
      });
    },
    [dispatch, navigation]
  );

  const renderItem = ({ item, index }) => {
    const priceUnit = "ngày";
    const displayTitle = resolvePropertyTitle(item);
    const displayName = resolvePropertyName(item);
    return (
      <TouchableOpacity
       onPress={() =>
          openPropertyDetail(item.propertyId, {
            source: "search_results",
            position: index,
          })
        }
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
            {displayTitle}
          </Text>
          {displayName ? (
            <Text style={{ fontSize: 12, color: TEXT_MUTED }} numberOfLines={1}>
              {displayName}
            </Text>
          ) : null}
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

  const renderAfterSearchSection = useCallback(() => {
    if (afterSearchError) {
      return (
        <View style={{ paddingHorizontal: 12, paddingVertical: 16 }}>
          <Text style={{ textAlign: 'center', color: '#dc2626' }}>
            {afterSearchError}
          </Text>
        </View>
      );
    }

    if (afterSearchLoading && afterSearchRecommendations.length === 0) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={ORANGE} />
        </View>
      );
    }

    if (afterSearchRecommendations.length === 0) {
      return null;
    }

    return (
      <View style={{ paddingHorizontal: 6, paddingBottom: 40 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 12,
            marginLeft: 6,
          }}
        >
          Gợi ý sau khi tìm kiếm
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            
          }}
        >
          {afterSearchRecommendations.map((item, index) => {
            const displayTitle = resolvePropertyTitle(item);
            const displayName = resolvePropertyName(item);

            return (
              <TouchableOpacity
                key={String(item.propertyId ?? index)}
                style={{
                  width: '48%',
                  margin: 6,
                  borderWidth: 1,
                  borderColor: GRAY,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
                onPress={() =>
                  openPropertyDetail(item.propertyId, {
                    source: 'after_search',
                    position: index,
                  })
                }
              >
                <S3Image
                  src={item.media?.[0]?.url || "https://picsum.photos/seed/reco/600/400"}
                  cacheKey={item.updatedAt}
                  style={{ width: "100%", height: 120, borderRadius: 8 }}
                  alt={item.title}
                />
                <View style={{ padding: 8 }}>
                  <Text numberOfLines={2} style={{ fontWeight: '700', fontSize: 13 }}>
                    {displayTitle}
                  </Text>
                  {displayName ? (
                    <Text style={{ fontSize: 12, color: TEXT_MUTED }} numberOfLines={1}>
                      {displayName}
                    </Text>
                 ) : null}
                  <Text style={{ fontSize: 12, color: ORANGE }}>
                    {item.price
                      ? `Từ ${formatPrice(item.price)}đ/ngày`
                      : 'Giá liên hệ'}
                  </Text>
                  {item.address?.addressFull ? (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
                    >
                      <Ionicons name="location" size={14} color={ORANGE} />
                      <Text
                        style={{ fontSize: 11, color: '#111', marginLeft: 4 }}
                        numberOfLines={1}
                      >
                        {formatAddress(item.address.addressFull)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {afterSearchLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <ActivityIndicator size="small" color={ORANGE} />
          </View>
        ) : null}
      </View>
    );
  }, [
    afterSearchError,
    afterSearchLoading,
    afterSearchRecommendations,
    formatAddress,
    formatPrice,
    openPropertyDetail,
  ]);

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
      <View
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setSearchBoxBottom(y + height);
        }}
        style={{
          margin: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: '#f5f5f5',
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          placeholder="Nhập tiêu đề tin đăng"
          placeholderTextColor={TEXT_MUTED}
          style={{ flex: 1, marginRight: 12 }}
          ref={searchInputRef}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
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
      <View
        onLayout={(event) => {
          setHistoryTop(event.nativeEvent.layout.y);
        }}
        style={{ paddingHorizontal: 12, marginBottom: 8 }}
      >
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
          keyExtractor={(item) => String(item.propertyId)}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 6,
            paddingBottom: 20,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40, color: TEXT_MUTED }}>
              Không tìm thấy kết quả phù hợp
            </Text>
          }
          ListFooterComponent={renderAfterSearchSection}
          ListFooterComponentStyle={afterSearchFooterStyle}
        />
      )}

      {showSuggestionsOverlay && (
        <View
          style={{
            position: 'absolute',
            top: historyTop ?? searchBoxBottom ?? 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 50,
            paddingTop: 12,
          }}
        >
          {suggestionsLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : suggestionsError ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: TEXT_MUTED, textAlign: 'center' }}>
                {suggestionsError}
              </Text>
            </View>
          ) : suggestionKeywords.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: TEXT_MUTED, textAlign: 'center' }}>
                Không có gợi ý phù hợp
              </Text>
            </View>
          ) : (
            <FlatList
              data={suggestionKeywords}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) =>
                item.normalizedKeyword || `${item.keyword}-${index}`
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      )}
      
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
