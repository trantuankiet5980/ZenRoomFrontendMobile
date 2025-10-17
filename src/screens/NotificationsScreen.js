import React, { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { fetchNotifications, markOneRead, markAllReadServer } from "../features/notifications/notificationsSlice";

const KNOWN_ROLES = new Set(["tenant", "landlord", "admin"]);

export default function NotificationsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(s => s.notifications);

  useFocusEffect(useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]));

   const parseRedirectSegments = useCallback((rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") return [];

    let sanitized = rawUrl.trim();
    if (!sanitized) return [];

    // Nếu backend trả absolute URL thì lấy phần path
    if (typeof URL !== "undefined") {
      try {
        const maybeUrl = new URL(sanitized);
        sanitized = maybeUrl.pathname;
      } catch (_) {
        // không phải absolute URL -> giữ nguyên
      }
    }

    // Bỏ query string, fragment và dấu '/'
    const [path] = sanitized.split(/[?#]/);
    return path
      .split("/")
      .map(segment => segment.trim())
      .filter(Boolean);
  }, []);

  const handleRedirect = useCallback((item) => {
    const segments = parseRedirectSegments(item?.redirectUrl);
    if (!segments.length) return;

    const maybeRole = segments[0]?.toLowerCase?.();
    const roleSegment = KNOWN_ROLES.has(maybeRole) ? maybeRole : null;
    const resourceIndex = roleSegment ? 1 : 0;
    const resource = segments[resourceIndex]?.toLowerCase?.();
    const identifier = segments[resourceIndex + 1];
    const parentNavigator = navigation.getParent ? navigation.getParent() : null;

    switch (resource) {
      case "bookings": {
        if (identifier) {
          navigation.navigate("BookingDetail", { id: identifier });
        } else if (roleSegment === "tenant") {
          if (parentNavigator) {
            parentNavigator.navigate("Profile", { screen: "MyBookingsScreen" });
          } else {
            navigation.navigate("Profile", { screen: "MyBookingsScreen" });
          }
        } else if (roleSegment === "landlord") {
          navigation.navigate("TenantsManager");
        }
        break;
      }
      case "properties": {
        if (identifier) {
          navigation.navigate("PropertyDetail", { propertyId: identifier });
        } else if (roleSegment === "landlord") {
          navigation.navigate("LandlordProperties");
        }
        break;
      }
      case "contracts": {
        if (identifier) {
          navigation.navigate("ContractDetail", { contractId: identifier });
        }
        break;
      }
      default:
        break;
    }
  }, [navigation, parseRedirectSegments]);

  const handleNotificationPress = useCallback((item) => {
    if (!item) return;

    if (!item.isRead) {
      dispatch(markOneRead(item.notificationId));
    }

    handleRedirect(item);
  }, [dispatch, handleRedirect]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: item.isRead ? "#fff" : "#FFF6EA",
      }}
      onPress={() => handleNotificationPress(item)}
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
