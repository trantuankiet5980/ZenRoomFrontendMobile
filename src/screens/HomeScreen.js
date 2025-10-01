import { ScrollView, View, Text, Image, TouchableOpacity, Dimensions, FlatList } from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import ExploreSection from "../components/ExploreSection";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { districtImages } from '../data/districtImages';
import { fetchProperties } from "../features/properties/propertiesThunks";
import { fetchProvinces, fetchDistricts } from "../features/administrative/administrativeThunks";
import S3Image from "../components/S3Image";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const user = useSelector((s) => s.auth.user);
  const unread = useSelector(s => s.notifications?.unreadCount ?? 0);
  const name = user?.fullName || user?.name || "";
  const role = (user?.role || user?.roleName || "").toLowerCase();

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { rooms = [], buildings = [], loading } = useSelector(state => state.properties || {});
  const provinces = useSelector(s => s.administrative.provinces || []);
  const districts = useSelector(s => s.administrative.districts || []);

  const [selectedCity, setSelectedCity] = useState("");
  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name || selectedCity;


  // Load dữ liệu khi mount
  useEffect(() => {
    dispatch(fetchProvinces());
    dispatch(fetchProperties({ page: 0, size: 20, type: "BUILDING", postStatus: "APPROVED" }));
    dispatch(fetchProperties({ page: 0, size: 20, type: "ROOM", postStatus: "APPROVED" }));
  }, [dispatch]);

  // Chọn city mặc định là tỉnh đầu tiên
  useEffect(() => {
    if (provinces.length > 0 && !selectedCity) {
      const firstCity = provinces[0].code;
      setSelectedCity(firstCity);
      dispatch(fetchDistricts(firstCity));
    }
  }, [provinces, selectedCity, dispatch]);

  const handleSelectCity = (cityCode) => {
    setSelectedCity(cityCode);
    dispatch(fetchDistricts(cityCode));
  };

  const districtItems = districts.map((district) => ({
    key: district.code,
    label: district.name,
    imageUri: districtImages[district.name],
  }));

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
              <Text style={{ color: "#fff", fontSize: 10 }}>{unread > 99 ? "99+" : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ paddingLeft: 20, paddingBottom: 10, flexDirection: "row" }}>
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
        <LandlordPanel selectedCity={selectedCity} setSelectedCity={handleSelectCity} />
        <TenantPanel selectedCity={selectedCity} setSelectedCity={handleSelectCity} />
      </View>

      {/* Explore districts */}
      <ExploreSection
        title={`Khám phá ${selectedCityName}`}
        items={districtItems}
        itemSize={150}
        onPressItem={(item) => navigation.navigate("SearchRooms", { districtCode: item.key })}
      />

      {/* Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate("SearchRooms")}
        style={{ alignItems: "center", marginHorizontal: 20, marginVertical: 20 }}
      >
        <Image
          source={require("../../assets/images/datPhong.png")}
          style={{ height: 300, width: screenWidth - 40, resizeMode: "cover", borderRadius: 15 }}
        />
      </TouchableOpacity>

      {/* Căn hộ */}
      <View style={{ paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 10 }} >
        <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, marginTop: 12 }}>Căn hộ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SearchRooms", { type: "BUILDING" })}>
          <Text style={{ fontSize: 15, fontWeight: "bold", marginTop: 12, color: "#f36031" }}>
            Xem tất cả
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.propertyId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.propertyId })}
          >
            <S3Image
              src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
              cacheKey={item.updatedAt}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              alt={item.title}
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{item.title}</Text>
              {item.price ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                  <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#f36031' }}>Từ {formatPrice(item.price)}đ/ngày</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#777', marginVertical: 2 }}>Giá liên hệ</Text>
              )}
              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#555' }} numberOfLines={1}>{formatAddress(item.address.addressFull)}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      {/* Phòng trọ */}
      <View style={{ paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 10 }} >
        <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, marginTop: 12 }}>Phòng trọ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SearchRooms", { type: "ROOM" })}>
          <Text style={{ fontSize: 15, fontWeight: "bold", marginTop: 12, color: "#f36031" }}>
            Xem tất cả
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.propertyId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.propertyId })}
          >
            <S3Image
              src={item.media?.[0]?.url}
              cacheKey={item.updatedAt}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              alt={item.title}
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{item.title}</Text>
              {item.price ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                  <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#f36031' }}>Từ {formatPrice(item.price)}đ/tháng</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#777', marginVertical: 2 }}>Giá liên hệ</Text>
              )}
              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#555' }} numberOfLines={1}>{formatAddress(item.address.addressFull)}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={{ height: 130, backgroundColor: '#f36031', marginHorizontal: 20, marginTop: 8, marginBottom: 4, borderRadius: 15 }} />
    </ScrollView >
  );
}
