import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RoomCard from "./RoomCard";
import promotion from "../../assets/images/promotion.png";

export default function RoomLists({ uyTinRooms, cheapRooms }) {
  const navigation = useNavigation();

  return (
    <View style={{ paddingBottom: 30 }}>
      {/* Chủ nhà uy tín */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="person-circle-outline" size={26} color="black" style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Chủ nhà uy tín</Text>
          </View>
          <TouchableOpacity onPress={() => console.log("Xem tất cả Chủ nhà uy tín")}>
            <Text style={styles.linkText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {uyTinRooms.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.listingCard}
            onPress={() => navigation.navigate("RoomDetail", { room: item })}
          >
            <Image source={item.image} style={styles.listingImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.listingTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="cash-outline" size={18} color="#ff9800" />
                <Text style={styles.listingPrice}>{item.price}</Text>
              </View>
              <Text style={styles.listingAddress} numberOfLines={1}>
                {item.address}
              </Text>
              <Text style={styles.listingAvailable}>
                {item.available ? "Còn phòng" : "Hết phòng"}
              </Text>
              <Text style={styles.listingTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Khuyến mãi */}
      <View style={{ marginVertical: 15 }}>
        <Image source={promotion} style={{ width: "100%", height: 200 }} resizeMode="cover" />
      </View>

      {/* Phòng giá rẻ */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="home-outline" size={22} color="#111827" style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Phòng giá rẻ</Text>
          </View>
          <TouchableOpacity onPress={() => console.log("Xem tất cả phòng giá rẻ")}>
            <Text style={styles.linkText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {cheapRooms.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate("RoomDetail", { room: item })}
            >
              <RoomCard
                image={item.image}
                title={item.title}
                price={item.price}
                address={item.address}
                available={item.available}
                time={item.time}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 16,
  },
  listingCard: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  listingImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  listingTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  listingPrice: {
    color: "#ff9800",
    fontWeight: "bold",
    marginLeft: 4,
  },
  listingAddress: {
    color: "#666",
    fontSize: 12,
    marginVertical: 2,
  },
  listingAvailable: {
    fontSize: 12,
    color: "#009688",
  },
  listingTime: {
    fontSize: 12,
    color: "#888",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 3,
  },
  gridItem: {
    width: "48%",
    marginBottom: 10,
  },
});
