import React, { useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, Platform, StatusBar,Alert } from "react-native";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch } from "react-redux";
import { fetchFavorites, removeAllFavorites } from "../features/favorites/favoritesThunks";
import { recordUserEvent } from "../features/events/eventsThunks";
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";

const FavoritesScreen = ({ navigation }) => {
  const favorites = useSelector((state) => state.favorites.items);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFavorites());
    }, [dispatch])
  );

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#666" }}>Chưa có phòng nào được lưu ❤️</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={26} color="#111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Yêu thích</Text>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if (favorites.length > 0) {
                Alert.alert(
                  "Xóa tất cả?",
                  "Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?",
                  [
                    { text: "Hủy", style: "cancel" },
                    {
                      text: "Xóa",
                      style: "destructive",
                      onPress: () => dispatch(removeAllFavorites()),
                    },
                  ]
                );
              }
            }}
          >
            {favorites.length > 0 && (
              <Ionicons name="trash-outline" size={22} color="#f33" />
            )}
          </TouchableOpacity>
        </View>
      </View>


      {/* Danh sách favorites */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.favoriteId}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const property = item.property;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("PropertyDetail", { propertyId: property.propertyId })
              }
            >
              <Image
                source={{ uri: property.media?.[0]?.url || "https://picsum.photos/200/120" }}
                style={styles.image}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {property.title || "Không có tiêu đề"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon name="cash" size={20} color="#f36031" />
                  <Text style={styles.price}>
                    {property.price
                      ? `${Number(property.price).toLocaleString("vi-VN")} đ/tháng`
                      : "Thỏa thuận"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                  <Text style={styles.subText}>
                    {(property.address?.addressFull?.replace(/_/g, " ")) ?? ""}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  safeHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  headerBtn: {
    width: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600"
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8
  },
  title: {
    fontSize: 15,
    fontWeight: "600"
  },
  price: {
    fontSize: 14,
    color: "#f36031",
    marginVertical: 2
  },
  subText: {
    fontSize: 12,
    color: "#555"
  },
});
