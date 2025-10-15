import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import { useSelector, useDispatch } from "react-redux";
import {
  useNavigation,
  useFocusEffect,
  useScrollToTop,
} from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { fetchProperties } from "../features/properties/propertiesThunks";
import {
  fetchProvinces,
  fetchDistricts,
} from "../features/administrative/administrativeThunks";
import S3Image from "../components/S3Image";
import {
  ADMIN_ALL_LABEL,
  ADMIN_ALL_VALUE,
  isAllAdministrativeValue,
} from "../constants/administrative";
import { clearDistricts } from "../features/administrative/administrativeSlice";
import * as Location from "expo-location";
import { showToast } from "../utils/AppUtils";
import Modal from "react-native-modal";
import { resolvePropertyTitle, resolvePropertyName } from "../utils/propertyDisplay";
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from "../features/favorites/favoritesThunks";
import {
  fetchRecentlyViewed,
  recordUserEvent,
} from "../features/events/eventsThunks";
import { fetchPersonalRecommendations } from "../features/recommendations/recommendationsThunks";

const DEFAULT_MAP_REGION = {
  latitude: 21.027763,
  longitude: 105.83416,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const RECENTLY_VIEWED_PAGE_SIZE = 7;

const parseCoordinate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const user = useSelector((s) => s.auth.user);
  const unread = useSelector((s) => s.notifications?.unreadCount ?? 0);
  const name = user?.fullName || user?.name || "";
  const role = (user?.role || user?.roleName || "").toLowerCase();

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { buildings = [], loading } = useSelector(
    (state) => state.properties || {}
  );
  const provinces = useSelector((s) => s.administrative.provinces || []);
  const districts = useSelector((s) => s.administrative.districts || []);
  const favorites = useSelector((s) => s.favorites?.items || []);

  const [selectedCity, setSelectedCity] = useState(ADMIN_ALL_VALUE);
  const [selectedDistrict, setSelectedDistrict] = useState(ADMIN_ALL_VALUE);
  const [locating, setLocating] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [favoriteActionLoading, setFavoriteActionLoading] = useState(false);
  const recentlyViewedState =
    useSelector((state) => state.events?.recentlyViewed) || {};
  const personalRecommendationsState =
    useSelector((state) => state.recommendations?.personal) || {};
  const {
    items: recentlyViewed = [],
    loading: recentLoading = false,
    hasMore: recentHasMore = true,
    page: recentNextPage = 0,
    initialLoaded: recentInitialLoaded = false,
    error: recentError = null,
    lastRequestedPage: recentLastRequestedPage = 0,
  } = recentlyViewedState;
  const {
    items: personalRecommendations = [],
    loading: personalLoading = false,
    error: personalError = null,
    loaded: personalLoaded = false,
  } = personalRecommendationsState;

  const scrollViewRef = useRef(null);
  useScrollToTop(scrollViewRef);

  const selectedCityName = useMemo(() => {
    if (isAllAdministrativeValue(selectedCity)) {
      return ADMIN_ALL_LABEL;
    }
    return (
      provinces.find((p) => p.code === selectedCity)?.name_with_type ||
      selectedCity
    );
  }, [provinces, selectedCity]);

  // Load danh sách tỉnh khi mount
  useEffect(() => {
    dispatch(fetchProvinces());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (role === "tenant") {
        dispatch(fetchFavorites());
      }
    }, [dispatch, role])
  );

  useEffect(() => {
    if (role === "tenant" && !personalLoaded && !personalLoading) {
      dispatch(fetchPersonalRecommendations());
    }
  }, [dispatch, personalLoaded, personalLoading, role]);

  // Khi chọn tỉnh -> load huyện
  const handleSelectCity = useCallback(
    (cityCode) => {
      const nextCity = cityCode || ADMIN_ALL_VALUE;
      if (isAllAdministrativeValue(nextCity) || nextCity === ADMIN_ALL_VALUE) {
        setSelectedCity(ADMIN_ALL_VALUE);
        setSelectedDistrict(ADMIN_ALL_VALUE);
        dispatch(clearDistricts());
        return;
      }
      setSelectedCity(nextCity);
      setSelectedDistrict(ADMIN_ALL_VALUE);
      dispatch(fetchDistricts(nextCity));
    },
    [dispatch]
  );

  // Khi chọn huyện
  const handleSelectDistrict = useCallback((districtCode) => {
    if (isAllAdministrativeValue(districtCode)) {
      setSelectedDistrict(ADMIN_ALL_VALUE);
      return;
    }
    setSelectedDistrict(districtCode);
  }, []);

  const handleOpenProperty = useCallback(
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

      navigation.navigate("PropertyDetail", {
        propertyId,
        loggedViewEvent: true,
      });
    },
    [dispatch, navigation]
  );

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

  const handleUseLocation = useCallback(async () => {
    try {
      setLocating(true);
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
          "Lỗi định vị! Vui lòng thử lại sau!"
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
      setLocating(false);
    }
  }, [buildTokenSet, dispatch, provinces]);

  // Fetch properties khi thay đổi tỉnh/huyện
  useEffect(() => {
    const provinceFilter = isAllAdministrativeValue(selectedCity)
      ? undefined
      : selectedCity;
    const districtFilter = isAllAdministrativeValue(selectedDistrict)
      ? undefined
      : selectedDistrict;

    const commonFilter = {
      page: 0,
      size: 20,
      postStatus: "APPROVED",
    };

    if (provinceFilter) {
      commonFilter.provinceCode = provinceFilter;
    }
    if (districtFilter) {
      commonFilter.districtCode = districtFilter;
    }

    dispatch(fetchProperties({ ...commonFilter, type: "BUILDING" }));
    dispatch(fetchProperties({ ...commonFilter, type: "ROOM" }));
  }, [selectedCity, selectedDistrict, dispatch]);

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
  };

  const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

  const propertiesWithCoordinates = useMemo(() => {
    if (!Array.isArray(buildings)) {
      return [];
    }
    return buildings
      .map((property) => {
        const latitude = parseCoordinate(property?.address?.latitude);
        const longitude = parseCoordinate(property?.address?.longitude);
        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {
          return null;
        }

        return {
          ...property,
          latitude,
          longitude,
        };
      })
      .filter(Boolean);
  }, [buildings]);

  const mapRegion = useMemo(() => {
    if (!propertiesWithCoordinates.length) {
      return DEFAULT_MAP_REGION;
    }

    const latitudes = propertiesWithCoordinates.map((p) => p.latitude);
    const longitudes = propertiesWithCoordinates.map((p) => p.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = Math.max(
      (maxLat - minLat || 0) * 1.5,
      DEFAULT_MAP_REGION.latitudeDelta
    );
    const longitudeDelta = Math.max(
      (maxLng - minLng || 0) * 1.5,
      DEFAULT_MAP_REGION.longitudeDelta
    );

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [propertiesWithCoordinates]);

  const mapViewKey = useMemo(() => {
    const ids = propertiesWithCoordinates
      .map((item) => item.propertyId)
      .join("-");
    return `${selectedCity || "all"}-${selectedDistrict || "all"}-${ids}`;
  }, [propertiesWithCoordinates, selectedCity, selectedDistrict]);

  const selectedPropertyFavorite = useMemo(() => {
    if (!selectedProperty?.propertyId) {
      return false;
    }
    return favorites.some(
      (fav) =>
        fav?.property?.propertyId === selectedProperty.propertyId ||
        fav?.propertyId === selectedProperty.propertyId
    );
  }, [favorites, selectedProperty]);

  const selectedPropertyTitle = useMemo(() => {
    return selectedProperty ? resolvePropertyTitle(selectedProperty) : null;
  }, [selectedProperty]);

  const selectedPropertyDisplayName = useMemo(() => {
    return selectedProperty ? resolvePropertyName(selectedProperty) : null;
  }, [selectedProperty]);

  useEffect(() => {
    if (!selectedProperty) {
      return;
    }

    const stillExists = buildings?.some(
      (property) => property.propertyId === selectedProperty.propertyId
    );

    if (!stillExists) {
      setSelectedProperty(null);
    }
  }, [buildings, selectedProperty]);

  const handleToggleFavorite = useCallback(async () => {
    if (role !== "tenant" || !selectedProperty?.propertyId) {
      return;
    }

    try {
      setFavoriteActionLoading(true);
      if (selectedPropertyFavorite) {
        await dispatch(removeFavorite(selectedProperty.propertyId)).unwrap();
        showToast(
          "success",
          "top",
          "Thông báo",
          "Đã xóa khỏi danh sách yêu thích"
        );
      } else {
        await dispatch(addFavorite(selectedProperty.propertyId)).unwrap();
        showToast(
          "success",
          "top",
          "Thông báo",
          "Đã thêm vào danh sách yêu thích"
        );
      }
    } catch (error) {
      showToast(
        "error",
        "top",
        "Thông báo",
        error?.message ||
          "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại."
      );
    } finally {
      setFavoriteActionLoading(false);
    }
  }, [dispatch, role, selectedProperty, selectedPropertyFavorite]);
  
  const requestRecentlyViewed = useCallback(
    (page = 0) => {
      dispatch(
        fetchRecentlyViewed({
          page,
          limit: RECENTLY_VIEWED_PAGE_SIZE,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (!recentInitialLoaded && !recentLoading) {
      requestRecentlyViewed(0);
    }
  }, [recentInitialLoaded, recentLoading, requestRecentlyViewed]);

  useEffect(() => {
    if (recentError && recentLastRequestedPage === 0) {
      showToast("error", "top", "Thông báo", recentError);
    }
  }, [recentError, recentLastRequestedPage]);

  useEffect(() => {
    if (personalError && personalLoaded) {
      showToast("error", "top", "Thông báo", personalError);
    }
  }, [personalError, personalLoaded]);

  const handleLoadMoreRecentlyViewed = useCallback(() => {
    if (!recentLoading && recentHasMore) {
      requestRecentlyViewed(recentNextPage);
    }
  }, [recentLoading, recentHasMore, requestRecentlyViewed, recentNextPage]);

  if (loading) return <Text>Đang tải dữ liệu...</Text>;

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ flexGrow: 1, gap: 12, paddingBottom: 70 }}
      >
      {/* Header */}
      <View style={{ backgroundColor: "#f36031", height: 150, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <Ionicons
            name="notifications"
            size={30}
            color="#fff"
            style={{ alignSelf: "flex-end", paddingHorizontal: 20 }}
          />
          {unread > 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 14,
                backgroundColor: "red",
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10 }}>
                {unread > 99 ? "99+" : unread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View
          style={{
            paddingLeft: 20,
            paddingBottom: 10,
            flexDirection: "row",
          }}
        >
          <TypingText
            text={`Xin chào, ${name}`}
            speed={150}
            pause={1000}
            style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}
          />
        </View>
      </View>

      {/* Panels */}
      <View style={{ marginTop: -40 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("AiChat")}
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#fef2f2",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Image source={require("../../assets/images/zenroom.png")} style={{ width: 45, height: 45, resizeMode: "contain" }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Trò chuyện với Zen AI</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
              Nhờ trợ lý gợi ý phòng theo nhu cầu, ngân sách và khu vực bạn muốn.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <LandlordPanel
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={handleSelectDistrict}
          onUseLocation={handleUseLocation}
          locating={locating}
          disableDistrictSelect={isAllAdministrativeValue(selectedCity)}
        />
        <TenantPanel
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={handleSelectDistrict}
          onUseLocation={handleUseLocation}
          locating={locating}
          disableDistrictSelect={isAllAdministrativeValue(selectedCity)}
        />
      </View>

      {/* Recently viewed properties */}
      {(recentLoading || recentlyViewed.length > 0) && (
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginLeft: 20,
              marginBottom: 8,
            }}
          >
            Nơi bạn đã xem gần đây
          </Text>
          {recentlyViewed.length === 0 ? (
            <View
              style={{
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color="#f36031" />
            </View>
          ) : (
            <FlatList
              data={[...recentlyViewed].reverse()}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.propertyId)}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 8,
              }}
              onEndReachedThreshold={0.4}
              onEndReached={handleLoadMoreRecentlyViewed}
              renderItem={({ item, index }) => {
                const displayTitle = resolvePropertyTitle(item);
                const displayName = resolvePropertyName(item);

                return (
                  <TouchableOpacity
                    style={{
                      width: 220,
                      marginRight:
                        index === recentlyViewed.length - 1 && !recentLoading
                          ? 0
                          : 12,
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#eee",
                    }}
                    onPress={() =>
                      handleOpenProperty(item.propertyId, {
                        source: "recently_viewed",
                        position: index,
                      })
                    }
                  >
                    <S3Image
                      src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
                      cacheKey={item.updatedAt}
                      style={{ width: "100%", height: 140 }}
                      alt={item.title}
                    />
                    <View style={{ padding: 12, gap: 6 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: "600" }}
                        numberOfLines={2}
                      >
                        {displayTitle}
                      </Text>
                   {displayName ? (
                        <Text
                          style={{ fontSize: 12, color: "#666" }}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#f36031",
                        }}
                        numberOfLines={1}
                      >
                        {item.price
                          ? `Từ ${formatPrice(item.price)}đ/ngày`
                          : "Giá liên hệ"}
                      </Text>
                      {item.address?.addressFull ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color="#555"
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{ fontSize: 12, color: "#555" }}
                            numberOfLines={2}
                          >
                            {formatAddress(item.address.addressFull)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                recentLoading ? (
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <ActivityIndicator size="small" color="#f36031" />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

      {/* Personal recommendations */}
      {role === "tenant" &&
        (personalLoading ||
          personalRecommendations.length > 0 ||
          personalLoaded ||
          personalError) && (
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginLeft: 20,
                marginBottom: 8,
              }}
            >
              Gợi ý dành riêng cho bạn
            </Text>
            {personalError ? (
              <Text
                style={{
                  textAlign: "center",
                  color: "#dc2626",
                  paddingHorizontal: 20,
                }}
              >
                {personalError}
              </Text>
            ) : personalLoading && personalRecommendations.length === 0 ? (
              <View
                style={{
                  paddingVertical: 20,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color="#f36031" />
              </View>
            ) : personalRecommendations.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  paddingHorizontal: 20,
                }}
              >
                Hiện chưa có gợi ý phù hợp.
              </Text>
            ) : (
              <FlatList
                data={personalRecommendations}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.propertyId)}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 8,
                }}
                renderItem={({ item, index }) => {
                  const displayTitle = resolvePropertyTitle(item);
                  const displayName = resolvePropertyName(item);

                  return (
                    <TouchableOpacity
                      style={{
                        width: 220,
                        marginRight:
                          index === personalRecommendations.length - 1
                            ? 0
                            : 12,
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "#eee",
                      }}
                      onPress={() =>
                        handleOpenProperty(item.propertyId, {
                          source: "personal_recommendation",
                          position: index,
                        })
                      }
                    >
                      <S3Image
                        src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
                        cacheKey={item.updatedAt}
                        style={{ width: "100%", height: 140 }}
                        alt={item.title}
                      />
                      <View style={{ padding: 12, gap: 6 }}>
                        <Text
                          style={{ fontSize: 15, fontWeight: "600" }}
                          numberOfLines={2}
                        >
                          {displayTitle}
                        </Text>
                      {displayName ? (
                          <Text
                            style={{ fontSize: 12, color: "#666" }}
                            numberOfLines={1}
                          >
                            {displayName}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#f36031",
                          }}
                          numberOfLines={1}
                        >
                          {item.price
                            ? `Từ ${formatPrice(item.price)}đ/ngày`
                            : "Giá liên hệ"}
                        </Text>
                        {item.address?.addressFull ? (
                          <View
                            style={{ flexDirection: "row", alignItems: "center" }}
                          >
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#555"
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={{ fontSize: 12, color: "#555" }}
                              numberOfLines={2}
                            >
                              {formatAddress(item.address.addressFull)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}

      {/* Bản đồ hiển thị căn hộ */}
        {/* <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 20,
            marginTop: 12,
          }}
        >
          {isAllAdministrativeValue(selectedCity)
            ? "Bản đồ căn hộ"
            : `Bản đồ căn hộ tại ${selectedCityName}${
                isAllAdministrativeValue(selectedDistrict)
                  ? ""
                  : `, ${
                      districts.find((d) => d.code === selectedDistrict)
                        ?.name_with_type || selectedDistrict
                    }`
              }`}
        </Text>

      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            height: 260,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#f2f2f2",
          }}
        >
          {propertiesWithCoordinates.length > 0 ? (
            <MapView
              key={mapViewKey}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
                latitudeDelta: mapRegion.latitudeDelta,
                longitudeDelta: mapRegion.longitudeDelta,
              }}
            >
              {propertiesWithCoordinates.map((property) => (
                <Marker
                  key={property.propertyId}
                  coordinate={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                  }}
                  pinColor="#f36031"
                  onPress={() => setSelectedProperty(property)}
                />
              ))}
            </MapView>
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#666", textAlign: "center" }}>
                Hiện chưa có căn hộ nào có thông tin vị trí trong khu vực đã
                chọn.
              </Text>
            </View>
          )}
        </View>
      </View> */}

      {/* Căn hộ */}
      <View
        style={{
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingRight: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 20,
            marginTop: 12,
          }}
        >
          Căn hộ
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("SearchRooms", {
              type: "BUILDING",
              provinceCode: selectedCity,
              districtCode: selectedDistrict,
            })
          }
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              marginTop: 12,
              color: "#f36031",
            }}
          >
            Xem tất cả
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.propertyId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
        renderItem={({ item, index }) => (
          
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() =>
              handleOpenProperty(item.propertyId, {
                source: "home_featured",
                position: index,
              })
            }
          >
            <S3Image
              src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
              cacheKey={item.updatedAt}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              alt={item.title}
            />
            <View style={{ padding: 8 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 14 }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.buildingName ? (
                <Text
                  style={{ fontSize: 12, color: "#666", marginVertical: 2 }}
                  numberOfLines={1}
                >
                  {item.buildingName}
                </Text>
              ) : null}
              {item.price ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 2,
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color="#f36031"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ fontSize: 12, color: "#f36031" }}>
                    Từ {formatPrice(item.price)}đ/ngày
                  </Text>
                </View>
              ) : (
                <Text
                  style={{ fontSize: 12, color: "#777", marginVertical: 2 }}
                >
                  Giá liên hệ
                </Text>
              )}
              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#555"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{ fontSize: 12, color: "#555" }}
                    numberOfLines={1}
                  >
                    {formatAddress(item.address.addressFull)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate("SearchRooms")}
        style={{
          alignItems: "center",
          marginHorizontal: 20,
        }}
      >
        <Image
          source={require("../../assets/images/datPhong.png")}
          style={{
            height: 300,
            width: screenWidth - 40,
            resizeMode: "cover",
            borderRadius: 15,
          }}
        />
      </TouchableOpacity>
    </ScrollView>
    <Modal
        isVisible={Boolean(selectedProperty)}
        onBackdropPress={() => setSelectedProperty(null)}
        onBackButtonPress={() => setSelectedProperty(null)}
        onSwipeComplete={() => setSelectedProperty(null)}
        swipeDirection={["down"]}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            gap: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Thông tin căn hộ
            </Text>
            {role === "tenant" && (
              <TouchableOpacity
                onPress={handleToggleFavorite}
                disabled={favoriteActionLoading}
                style={{
                  position: "absolute",
                  top: -5,
                  right: 30,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderWidth: 1,
                  borderColor: "#f36031",
                }}
              >
                <Ionicons
                  name={selectedPropertyFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color="#f36031"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setSelectedProperty(null)}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#f8f8f8",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: "row", gap: 12 }}
              onPress={() => {
                if (selectedProperty?.propertyId) {
                  const propertyId = selectedProperty.propertyId;
                  setSelectedProperty(null);
                  handleOpenProperty(propertyId, {
                    source: "map_preview",
                  });
                }
              }}
            >
              <S3Image
                src={
                  selectedProperty?.media?.[0]?.url ||
                  "https://picsum.photos/800/600"
                }
                cacheKey={selectedProperty?.updatedAt}
                style={{ width: 100, height: 100, borderRadius: 12 }}
                alt={selectedProperty?.title}
              />
              <View style={{ flex: 1, justifyContent: "space-between" }}>
                <View style={{ gap: 4 }}>
                  {selectedProperty?.buildingName ? (
                    <Text
                      style={{ fontSize: 13, fontWeight: "600" }}
                      numberOfLines={1}
                    >
                      {selectedProperty.buildingName}
                    </Text>
                  ) : null}
                  {selectedProperty?.title ? (
                    <Text
                      style={{ fontSize: 15, color: "#333" }}
                      numberOfLines={2}
                    >
                      {selectedProperty.title}
                    </Text>
                  ) : null}
                  {selectedProperty?.address?.addressFull ? (
                    <Text
                      style={{ fontSize: 12, color: "#666" }}
                      numberOfLines={2}
                    >
                      {formatAddress(selectedProperty.address.addressFull)}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#f36031",
                  }}
                >
                  {selectedProperty?.price
                    ? `Giá từ ${formatPrice(selectedProperty.price)}đ/ngày`
                    : "Giá liên hệ"}
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}
