import { ScrollView, View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { fetchProperties } from "../features/properties/propertiesThunks";
import S3Image from "../components/S3Image";

export default function FactoryScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { rooms = [], buildings = [], loading } = useSelector(state => state.properties || {});

  // Load dữ liệu
  useEffect(() => {
    dispatch(fetchProperties({ page: 0, size: 20, type: "BUILDING", postStatus: "APPROVED" }));
    dispatch(fetchProperties({ page: 0, size: 20, type: "ROOM", postStatus: "APPROVED" }));
  }, [dispatch]);

  const formatPriceWithUnit = (property) => {
    if (!property?.price) return "Giá liên hệ";
    const formatted = Number(property.price).toLocaleString("vi-VN");
    return property.propertyType === "ROOM"
      ? `Từ ${formatted}đ/tháng`
      : `Từ ${formatted}đ/ngày`;
  };

  const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

  if (loading) return <Text>Đang tải dữ liệu...</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* BUILDINGS */}
      <Text style={{ fontSize: 20, fontWeight: "bold", margin: 16 }}>Căn hộ</Text>
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.propertyId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ backgroundColor: "#fff", borderRadius: 12, width: "48%", marginBottom: 16 }}
            onPress={() => navigation.navigate("PropertyDetail", { propertyId: item.propertyId })}
          >
            <S3Image
              src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
              cacheKey={item.updatedAt}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              alt={item.title}
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: "#f36031" }}>{formatPriceWithUnit(item)}</Text>
              </View>
              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: "#555" }} numberOfLines={1}>
                    {formatAddress(item.address.addressFull)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ROOMS */}
      <Text style={{ fontSize: 20, fontWeight: "bold", margin: 16 }}>Phòng trọ</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.propertyId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ backgroundColor: "#fff", borderRadius: 12, width: "48%", marginBottom: 16 }}
            onPress={() => navigation.navigate("PropertyDetail", { propertyId: item.propertyId })}
          >
            <S3Image
              src={item.media?.[0]?.url || "https://picsum.photos/800/600"}
              cacheKey={item.updatedAt}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              alt={item.title}
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                <Ionicons name="pricetag-outline" size={14} color="#f36031" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: "#f36031" }}>{formatPriceWithUnit(item)}</Text>
              </View>
              {item.address?.addressFull && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: "#555" }} numberOfLines={1}>
                    {formatAddress(item.address.addressFull)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}
