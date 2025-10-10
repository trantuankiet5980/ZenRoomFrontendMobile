import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
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

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const user = useSelector((s) => s.auth.user);
  const unread = useSelector((s) => s.notifications?.unreadCount ?? 0);
  const name = user?.fullName || user?.name || "";
  const role = (user?.role || user?.roleName || "").toLowerCase();

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { rooms = [], buildings = [], loading } = useSelector(
    (state) => state.properties || {}
  );
  const provinces = useSelector((s) => s.administrative.provinces || []);
  const districts = useSelector((s) => s.administrative.districts || []);

  const [selectedCity, setSelectedCity] = useState(ADMIN_ALL_VALUE);
  const [selectedDistrict, setSelectedDistrict] = useState(ADMIN_ALL_VALUE);
  const [locating, setLocating] = useState(false);

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
      setLocating(false);
    }
  }, [dispatch, normalizeText, provinces]);

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

  if (loading) return <Text>Đang tải dữ liệu...</Text>;

  return (
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
  );
}
