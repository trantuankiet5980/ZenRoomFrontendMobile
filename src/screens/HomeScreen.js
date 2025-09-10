import { ScrollView, View, Text, Image, TouchableOpacity, Dimensions, FlatList } from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import ExploreSection from "../components/ExploreSection";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { locations } from '../data/locationData';
import { districtImages } from '../data/districtImages';
import { fetchProperties } from "../features/properties/propertiesThunks";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const user = useSelector((s) => s.auth.user);
  const name = user?.fullName || user?.name || "";
  const [selectedCity, setSelectedCity] = useState("Hồ Chí Minh");

  const navigation = useNavigation();
  const dispatch = useDispatch();
  // expecting state.properties = { rooms: [], buildings: [], loading: boolean }
  const { rooms = [], buildings = [], loading } = useSelector(state => state.properties || {});

  const districtItems = (locations[selectedCity] || []).map((district, index) => ({
    key: `${selectedCity}-${index}`,
    label: district,
    imageUri: districtImages[district],
  }));

  // helper format tiền
  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
  };

  useEffect(() => {
    // nếu API chấp nhận type param — gọi 2 lần để phân biệt ROOM & BUILDING
    dispatch(fetchProperties({ page: 0, size: 20, type: "ROOM" }));
    dispatch(fetchProperties({ page: 0, size: 20, type: "BUILDING" }));
  }, [dispatch]);

  if (loading) return <Text>Đang tải phòng...</Text>;

  const formatAddress = (addr = "") => {
    return addr.replace(/_/g, " ").trim();
  };


  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{
        flexGrow: 1,
        gap: 12,
        paddingBottom: 70,
      }}
    >
      <View style={{ backgroundColor: "#f36031", height: 150, paddingTop: 50 }}>
        <TouchableOpacity>
          <Ionicons
            name="notifications"
            size={30}
            color="#fff"
            style={{ alignSelf: "flex-end", paddingHorizontal: 20 }}
          />
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

      <View style={{ marginTop: -40 }}>
        <LandlordPanel selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <TenantPanel selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
      </View>

      <ExploreSection
        title={`Khám phá ${selectedCity}`}
        items={districtItems}
        itemSize={150}
        onPressItem={(item) => navigation.navigate("SearchRooms", { district: item.label })}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("SearchRooms")}
        style={{ alignItems: "center", marginHorizontal: 20, marginVertical: 20 }}
      >
        <Image
          source={require("../../assets/images/datPhong.png")}
          style={{ height: 300, width: screenWidth - 40, resizeMode: "cover", borderRadius: 15 }}
        />
      </TouchableOpacity>

      {/* Phòng trọ */}
      <Text style={{ fontSize: 18, fontWeight: "bold", marginLeft: 20, marginTop: 12 }}>Phòng trọ</Text>
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
              marginBottom: 12,
              flex: 1,
              marginHorizontal: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.propertyId })}
          >
            <Image
              source={{ uri: item.media?.[0]?.url || "https://picsum.photos/seed/room/600/400" }}
              style={{ width: "100%", height: 120 }}
              resizeMode="cover"
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{item.title}</Text>

              {item.price ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                  <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#f36031' }}>
                    Từ {formatPrice(item.price)}đ/tháng
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#777', marginVertical: 2 }}>Giá liên hệ</Text>
              )}

              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#555' }} numberOfLines={1}>
                    {formatAddress(item.address?.addressFull)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Tòa nhà */}
      <Text style={{ fontSize: 18, fontWeight: "bold", marginLeft: 20, marginTop: 12 }}>Tòa nhà</Text>
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
              marginBottom: 12,
              flex: 1,
              marginHorizontal: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.propertyId })}
          >
            <Image
              source={{ uri: item.media?.[0]?.url || "https://picsum.photos/seed/building/600/400" }}
              style={{ width: "100%", height: 120 }}
              resizeMode="cover"
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{item.title}</Text>

              {/* Giá tòa nhà */}
              {item.price ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                  <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#f36031' }}>
                    Từ {formatPrice(item.price)}đ/tháng
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#777', marginVertical: 2 }}>Giá liên hệ</Text>
              )}

              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#555' }} numberOfLines={1}>
                    {formatAddress(item.address?.addressFull)}
                  </Text>

                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={{ height: 130, backgroundColor: '#f36031', marginHorizontal: 20, marginTop: 8, marginBottom: 4, borderRadius: 15 }} />
    </ScrollView>
  );
}
