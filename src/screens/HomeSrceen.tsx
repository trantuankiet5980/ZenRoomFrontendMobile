import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Sidebar from "../components/Sidebar";
import { locations } from "../data/locationData";
import { districtImages } from "../data/districtImages";
import { uyTinRooms, cheapRooms } from "../data/homeData";
import room1 from "../../assets/images/p1.png";
import promotion from "../../assets/images/promotion.png";

const HomeScreen: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Hồ Chí Minh");

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };
  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }} 
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.bellButton}>
            <Icon name="bell-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Search + Menu */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setVisible(true)}
            >
              <Icon name="map-marker-radius" size={18} color="#ff9800" />
              <Text style={styles.locationText}>{selectedCity}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.search}>
              <Text style={styles.searchText}>Tìm kiếm tin đăng</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.menuContainer}>
            <MenuItem icon="tag" label="Săn phòng giá tốt" />
            <MenuItem icon="map-marker-radius" label="Quanh đây" />
            <MenuItem icon="home-city" label="Khu vực hot" />
            <MenuItem icon="fire" label="Khuyến mãi" />
          </View>
        </View>

        {/* Khám phá */}
        <View style={styles.exploreSection}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Icon
              name="map"
              size={30}
              color="#ff9800"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.exploreTitle}>Khám phá {selectedCity}</Text>
          </View>

          <FlatList
            data={chunkArray(locations[selectedCity], 2)}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.column}>
                {item.map((district, idx) => (
                  <TouchableOpacity key={idx} style={styles.districtItem}>
                    <Image
                      source={
                        districtImages[district] ||
                        require("../../assets/districts/binh_chanh.png")
                      }
                      style={styles.districtImage}
                    />
                    <View style={styles.overlay}>
                      <Text style={styles.districtText}>{district}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Chủ nhà uy tín */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Icon
                name="account-circle"
                size={30}
                color="#ff9800"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.exploreTitle}>Chủ nhà uy tín</Text>
            </View>
            <TouchableOpacity
              onPress={() => console.log("Xem tất cả Chủ nhà uy tín")}
            >
              <Text
                style={{ color: "#ff9800", fontWeight: "bold", fontSize: 16 }}
              >
                Xem tất cả
              </Text>
            </TouchableOpacity>
          </View>

          {uyTinRooms.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listingCard}
              onPress={() =>
                console.log("Navigate to RoomDetail", {
                  roomId: item.id,
                  roomData: item,
                })
              }
            >
              {/* <Image source={{ uri: item.image }} style={styles.listingImage} /> */}
              <Image source={room1} style={styles.listingImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.listingTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row"}}>
                  <Icon name="currency-usd" size={20} color="#ff9800" />
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

        {/* Hình ảnh khuyến mãi */}
        <View style={{ marginVertical: 10 }}>
          <Image source={promotion} style={{ width: "100%", height: 200 }} />
        </View>

        {/* Phòng giá rẻ */}
        <View style={styles.section}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Icon
                name="account-circle"
                size={30}
                color="#ff9800"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.exploreTitle}>Phòng giá rẻ</Text>
            </View>
            <TouchableOpacity
              onPress={() => console.log("Xem tất cả phòng giá rẻ")}
            >
              <Text
                style={{ color: "#ff9800", fontWeight: "bold", fontSize: 16 }}
              >
                Xem tất cả
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingHorizontal: 3,
            }}
          >
            {cheapRooms.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{ width: "48%", marginBottom: 10 }}
                onPress={() =>
                  console.log("Navigate to RoomDetail", {
                    roomId: item.id,
                    roomData: item,
                  })
                }
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
      </ScrollView>

      {/* Modal chọn tỉnh/thành phố */}
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn Tỉnh/Thành phố</Text>
            <FlatList
              data={Object.keys(locations)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => {
                    setSelectedCity(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.cityText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sidebar bottom */}
      <Sidebar onNavigate={(screen) => console.log("Đi tới:", screen)} />
    </View>
  );
};

export default HomeScreen;

const MenuItem = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.menuIcon}>
      <Icon name={icon} size={24} color="#ff6600" />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const RoomCard = ({
  image,
  title,
  price,
  address,
  available,
  time,
}: {
  image: string;
  title: string;
  price: string;
  address: string;
  available: number;
  time: string;
}) => (
  <View style={styles.roomCard}>
    {/* <Image source={{ uri: image }} style={styles.roomImage} /> */}
    <Image source={room1} style={styles.roomImage} />
    <Text style={styles.roomTitle}>{title}</Text>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name="currency-usd" size={20} color="#ff9800" />
      <Text style={styles.roomPrice}>{price}</Text>
    </View>
    <Text style={styles.roomAddress}>{address}</Text>
    <Text style={styles.roomAvailable}>
      {available > 0 ? `${available} phòng còn trống` : "Hết phòng"}
    </Text>
    <Text style={styles.roomTime}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#ff9800",
    height: 140,
    padding: 16,
    position: "relative",
    justifyContent: "flex-start",
    top: 0,
  },
  bellButton: {
    position: "absolute",
    top: 30,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 8,
    borderRadius: 50,
  },
  // làm cái khung nỗi
  searchContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -30, // để nó nổi lên chồng trên header
    borderRadius: 12,
    padding: 12,
    elevation: 4, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginTop: 10,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  locationText: { marginLeft: 6, color: "#ff9800", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "50%",
  },
  modalTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },

  cityItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cityText: { fontSize: 15, color: "#333" },

  closeText: {
    textAlign: "center",
    color: "#ff9800",
    marginTop: 12,
    fontWeight: "600",
  },

  exploreSection: { padding: 12 },
  exploreTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },

  districtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 300,
  },
  column: {
    flexDirection: "column",
    marginRight: 10,
  },
  districtItem: {
    width: 140,
    height: 100,
    margin: 6,
    borderRadius: 10,
    overflow: "hidden", // để text không tràn ra ngoài ảnh
    position: "relative",
  },

  districtImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject, // phủ toàn bộ ảnh
    backgroundColor: "rgba(0,0,0,0.3)", // làm mờ ảnh để text rõ hơn
    justifyContent: "center",
    alignItems: "center",
  },

  districtText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  search: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  searchText: {
    color: "#C6AAAA",
    fontSize: 14,
    marginLeft: 4,
  },
  bannerContainer: { paddingHorizontal: 16, marginTop: 10 },
  banner: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },

  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  menuItem: { alignItems: "center", flex: 1 },
  menuIcon: {
    backgroundColor: "#ffe2d1",
    padding: 14,
    borderRadius: 50,
    marginBottom: 6,
  },
  menuLabel: { fontSize: 13, fontWeight: "500", textAlign: "center" },

  section: { marginTop: 25, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  viewAll: { color: "#ff9800", fontSize: 14, fontWeight: "500" },

  listingCard: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listingImage: { width: 100, height: 100, borderRadius: 8 },
  listingTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  listingPrice: { color: "#ff6600", fontSize: 13, marginBottom: 2 },
  listingAddress: { fontSize: 12, color: "#555" },
  listingAvailable: { fontSize: 12, color: "#008000", marginTop: 2 },
  listingTime: { fontSize: 11, color: "#888", marginTop: 2 },
  roomCard: {
    width: 170,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    padding: 10,
    marginBottom: 16,
  },
  roomImage: { width: 147, height: 110, borderRadius: 8 },
  roomTitle: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  roomPrice: { fontSize: 13, color: "#ff6600", marginTop: 4 },
  roomAddress: { fontSize: 12, color: "#555", marginTop: 2 },
  roomTime: { fontSize: 11, color: "#888", marginTop: 2 },

  roomAvailable: { fontSize: 12, color: "#008000", marginTop: 2 },

});
