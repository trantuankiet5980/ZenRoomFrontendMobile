import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from "../features/favorites/favoritesThunks";

const DEFAULT_MAP_REGION = {
  latitude: 21.027763,
  longitude: 105.83416,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

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
  
  if (loading) return <Text>Đang tải dữ liệu...</Text>;

  return (
    <>
      <ScrollView
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

      {/* Bản đồ hiển thị căn hộ */}
      
        {/* //neu tat ca thi khong hien thi */}
        <Text
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
              {propertiesWithCoordinates.map((property) => {
                const priceLabel = property.price
                  ? `đ${formatPrice(property.price)}`
                  : "Liên hệ";
                return (
                  <Marker
                    key={property.propertyId}
                    coordinate={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                    }}
                    onPress={() => setSelectedProperty(property)}
                  >
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 18,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: "#f36031",
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: "#f36031",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {priceLabel}
                      </Text>
                    </View>
                  </Marker>
                );
              })}
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
      </View>

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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() =>
              navigation.navigate("PropertyDetail", {
                propertyId: item.propertyId,
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
              {selectedProperty?.propertyName || selectedProperty?.title ||
                "Thông tin căn hộ"}
            </Text>
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
                  navigation.navigate("PropertyDetail", { propertyId });
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
                  {selectedProperty?.propertyName ? (
                    <Text
                      style={{ fontSize: 13, color: "#333" }}
                      numberOfLines={1}
                    >
                      {selectedProperty.propertyName}
                    </Text>
                  ) : null}
                  {selectedProperty?.title ? (
                    <Text
                      style={{ fontSize: 15, fontWeight: "600" }}
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

            {role === "tenant" && (
              <TouchableOpacity
                onPress={handleToggleFavorite}
                disabled={favoriteActionLoading}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
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
                  size={22}
                  color="#f36031"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
