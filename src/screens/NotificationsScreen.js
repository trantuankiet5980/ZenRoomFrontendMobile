import React, { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { fetchNotifications, markOneRead, markAllReadServer } from "../features/notifications/notificationsSlice";

export default function NotificationsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(s => s.notifications);

  useFocusEffect(useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: item.isRead ? "#fff" : "#FFF6EA",
      }}
      onPress={() => {
        if (!item.isRead) dispatch(markOneRead(item.notificationId));
        // Điều hướng theo redirectUrl nếu có
        // if (item.redirectUrl?.startsWith("/landlord/properties/")) { ... }
      }}
    >
      <Text style={{ fontWeight: item.isRead ? "500" : "700" }}>
        {item.title || "Thông báo"}
      </Text>
      {!!item.message && (
        <Text style={{ color: "#666", marginTop: 4 }} numberOfLines={2}>
          {item.message}
        </Text>
      )}
      {!!item.createdAt && (
        <Text style={{ color: "#999", fontSize: 12, marginTop: 6 }}>
          {new Date(item.createdAt).toLocaleString("vi-VN")}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex:1, backgroundColor: "#fff" }}>
      <View style={{ padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Thông báo</Text>
        <TouchableOpacity onPress={() => dispatch(markAllReadServer())}>
          {unreadCount > 0 && <Text style={{ color: "#f36031" }}>Đánh dấu đã đọc</Text>}
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      <FlatList
        data={items}
        keyExtractor={(it)=> it.notificationId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          !loading ? <Text style={{ textAlign: "center", color: "#777", marginTop: 24 }}>Chưa có thông báo</Text> : null
        }
        onRefresh={() => dispatch(fetchNotifications())}
        refreshing={loading}
      />
    </View>
  );
}
