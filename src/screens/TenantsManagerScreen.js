import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import useHideTabBar from "../hooks/useHideTabBar";
import {
  fetchLandlordPendingBookings,
  fetchLandlordBookings,
  approveBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
} from "../features/bookings/bookingsThunks";

const ORANGE = "#f97316";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const SUCCESS = "#16a34a";
const CANCEL_RED = "#ef4444";

const { width, height } = Dimensions.get("window");

const BOOKING_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ duyệt",
  AWAITING_LANDLORD_APPROVAL: "Chờ thanh toán",
  APPROVED: "Đã thanh toán",
  CHECKED_IN: "Đang lưu trú",
  COMPLETED: "Đã trả phòng",
  CANCELLED: "Đã hủy",
};

const BOOKING_STATUS_COLORS = {
  PENDING_PAYMENT: "#f59e0b",
  AWAITING_LANDLORD_APPROVAL: "#2563eb",
  APPROVED: SUCCESS,
  CHECKED_IN: "#0ea5e9",
  COMPLETED: "#0d9488",
  CANCELLED: "#6b7280",
};

function getBookingStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] || status || "Không xác định";
}

function getBookingStatusColor(status) {
  return BOOKING_STATUS_COLORS[status] || TEXT;
}

function formatDateVN(dateString) {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function Header({ onBack }) {
  return (
    <View
      style={{
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        borderBottomColor: BORDER,
        borderBottomWidth: 1,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={TEXT} />
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>Quản lý khách thuê</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 24,
        borderWidth: active ? 0 : 1,
        borderColor: BORDER,
        backgroundColor: active ? ORANGE : "#fff",
        marginRight: 8,
        shadowColor: "#000",
        shadowOpacity: active ? 0.12 : 0.04,
        shadowRadius: active ? 4 : 2,
        shadowOffset: { width: 0, height: active ? 2 : 1 },
        elevation: active ? 2 : 1,
      }}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color: active ? "#fff" : TEXT,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TenantsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");

  const { landlordPending = [], landlordBookings = [], loading } = useSelector(
    (state) => state.bookings
  );
  const userId = useSelector((state) => state.auth.userId);

  // Làm mới dữ liệu khi tab thay đổi
  useEffect(() => {
    dispatch(fetchLandlordPendingBookings());
    dispatch(fetchLandlordBookings());
  }, [dispatch, tab]);

  // Chuẩn hóa dữ liệu từ cả landlordPending và landlordBookings
  const allBookings = useMemo(() => {
    return [...landlordPending, ...landlordBookings].reduce((acc, booking) => {
      if (!acc.some((b) => b.bookingId === booking.bookingId)) {
        acc.push(booking);
      }
      return acc;
    }, []);
  }, [landlordPending, landlordBookings]);

  // Chuẩn hóa dữ liệu theo tab
  const tenants = useMemo(() => {
    switch (tab) {
      case "pending":
        return allBookings
          .filter((b) => b.bookingStatus === "PENDING_PAYMENT")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName || "Chưa có thông tin",
            phone: b.tenant?.phoneNumber || "N/A",
            room: b.property?.title || "Phòng không xác định",
            when: b.startDate,
            note: b.note,
          }));
      case "approved":
        return allBookings
          .filter((b) => b.bookingStatus === "AWAITING_LANDLORD_APPROVAL")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName || "Chưa có thông tin",
            phone: b.tenant?.phoneNumber || "N/A",
            room: b.property?.title || "Phòng không xác định",
            when: b.startDate,
            note: b.note,
          }));
      case "renting":
        return allBookings
          .filter((b) => b.bookingStatus === "APPROVED")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName || "Chưa có thông tin",
            phone: b.tenant?.phoneNumber || "N/A",
            room: b.property?.title || "Phòng không xác định",
            when: b.startDate,
            note: b.note,
          }));
      case "staying":
        return allBookings
          .filter((b) => b.bookingStatus === "CHECKED_IN")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName || "Chưa có thông tin",
            phone: b.tenant?.phoneNumber || "N/A",
            room: b.property?.title || "Phòng không xác định",
            when: b.startDate,
            note: b.note,
          }));
      case "completed":
        return allBookings
          .filter((b) => b.bookingStatus === "COMPLETED")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName || "Chưa có thông tin",
            phone: b.tenant?.phoneNumber || "N/A",
            room: b.property?.title || "Phòng không xác định",
            when: b.startDate,
            note: b.note,
          }));
      default:
        return [];
    }
  }, [tab, allBookings]);

  // Lọc theo từ khóa tìm kiếm
  const filtered = useMemo(() => {
    if (!q.trim()) return tenants;
    const needle = q.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(needle) ||
        (t.phone || "").toLowerCase().includes(needle) ||
        (t.room || "").toLowerCase().includes(needle)
    );
  }, [tenants, q]);

  // Đếm số lượng bookings cho từng tab
  const counts = useMemo(() => {
    const counter = {};
    const tabs = [
      { key: "pending", statuses: ["PENDING_PAYMENT"] },
      { key: "approved", statuses: ["AWAITING_LANDLORD_APPROVAL"] },
      { key: "renting", statuses: ["APPROVED"] },
      { key: "staying", statuses: ["CHECKED_IN"] },
      { key: "completed", statuses: ["COMPLETED"] },
    ];
    tabs.forEach((tab) => {
      counter[tab.key] = allBookings.filter((b) =>
        tab.statuses.includes(b.bookingStatus)
      ).length;
    });
    return counter;
  }, [allBookings]);

  const renderItem = useCallback(
    ({ item }) => (
      <TenantCard item={item} tab={tab} dispatch={dispatch} navigation={navigation} userId={userId} />
    ),
    [tab, dispatch, navigation, userId]
  );

  const listEmpty = (
    <View style={{ alignItems: "center", marginTop: 48 }}>
      <Text style={{ color: MUTED }}>Chưa có booking phù hợp</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header
        onBack={() => {
          if (navigation?.canGoBack?.()) {
            const state = navigation.getState?.();
            const routes = state?.routes || [];
            const previousRoute = routes[routes.length - 2];
            navigation.goBack();
          }
        }}
      />

      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: BORDER,
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm theo tên, số điện thoại hoặc phòng"
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1, color: TEXT }}
        />
      </View>
      <View style={{ height: 55, marginTop: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        >
          <TabButton
            label={`Đang chờ duyệt${counts.pending ? ` (${counts.pending})` : ""}`}
            active={tab === "pending"}
            onPress={() => setTab("pending")}
          />
          <TabButton
            label={`Đã duyệt${counts.approved ? ` (${counts.approved})` : ""}`}
            active={tab === "approved"}
            onPress={() => setTab("approved")}
          />
          <TabButton
            label={`Chờ Check-in${counts.renting ? ` (${counts.renting})` : ""}`}
            active={tab === "renting"}
            onPress={() => setTab("renting")}
          />
          <TabButton
            label={`Đang lưu trú${counts.staying ? ` (${counts.staying})` : ""}`}
            active={tab === "staying"}
            onPress={() => setTab("staying")}
          />
          <TabButton
            label={`Đã trả phòng${counts.completed ? ` (${counts.completed})` : ""}`}
            active={tab === "completed"}
            onPress={() => setTab("completed")}
          />
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: TEXT }}>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
        listEmpty
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

/* ----- Sub components ----- */
function ActionButton({
  label,
  onPress,
  backgroundColor = ORANGE,
  type = "solid",
  disabled = false,
  style,
}) {
  const solid = type === "solid";
  const bgColor = solid ? backgroundColor : "#fff";
  const textColor = solid ? "#fff" : backgroundColor;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: disabled ? "#d1d5db" : bgColor,
        borderWidth: solid ? 0 : 1.5,
        borderColor: backgroundColor,
        minWidth: 104,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      <Text style={{ color: disabled ? "#6b7280" : textColor, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function TenantCard({ item, tab, dispatch, navigation, userId }) {
  const handleApprove = useCallback(() => {
    Alert.alert(
      "Xác nhận duyệt",
      `Bạn có chắc chắn muốn duyệt booking cho ${item.name} tại ${item.room}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Duyệt",
          style: "default",
          onPress: async () => {
            try {
              await dispatch(approveBooking(item.id)).unwrap();
              Alert.alert("Thành công", "Booking đã được duyệt thành công!");
              dispatch(fetchLandlordPendingBookings());
              dispatch(fetchLandlordBookings());
            } catch (e) {
              Alert.alert(
                "Lỗi",
                e.message || "Không thể duyệt booking. Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  }, [dispatch, item.id, item.name, item.room]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      "Xác nhận hủy",
      `Bạn có chắc chắn muốn hủy booking của ${item.name} tại ${item.room}?`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy booking",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(cancelBooking(item.id)).unwrap();
              Alert.alert("Thành công", "Booking đã được hủy thành công!");
              dispatch(fetchLandlordPendingBookings());
              dispatch(fetchLandlordBookings());
            } catch (e) {
              Alert.alert(
                "Lỗi",
                e.message || "Không thể hủy booking. Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  }, [dispatch, item.id, item.name, item.room]);

  const handleCheckIn = useCallback(() => {
    Alert.alert(
      "Xác nhận check-in",
      `Xác nhận ${item.name} đã check-in tại ${item.room}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Check-in",
          style: "default",
          onPress: async () => {
            try {
              await dispatch(checkInBooking(item.id)).unwrap();
              Alert.alert("Thành công", "Check-in thành công!");
              dispatch(fetchLandlordBookings());
            } catch (e) {
              Alert.alert(
                "Lỗi",
                e.message || "Không thể check-in. Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  }, [dispatch, item.id, item.name, item.room]);

  const handleCheckOut = useCallback(() => {
    Alert.alert(
      "Xác nhận trả phòng",
      `Xác nhận ${item.name} đã trả phòng ${item.room}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Trả phòng",
          style: "default",
          onPress: async () => {
            try {
              await dispatch(checkOutBooking(item.id)).unwrap();
              Alert.alert("Thành công", "Trả phòng thành công!");
              dispatch(fetchLandlordBookings());
            } catch (e) {
              Alert.alert(
                "Lỗi",
                e.message || "Không thể thực hiện trả phòng. Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  }, [dispatch, item.id, item.name, item.room]);

  const handleView = useCallback(() => {
    navigation.navigate("BookingDetail", { id: item.id });
  }, [navigation, item.id]);

  // Điều chỉnh hiển thị nút hành động
  const showApproveButton = tab === "pending" && item.status === "PENDING_PAYMENT";
  const showCancelButton =
    (tab === "pending" && item.status === "PENDING_PAYMENT") ||
    (tab === "approved" && item.status === "AWAITING_LANDLORD_APPROVAL");
  const showCheckInButton = tab === "renting" && item.status === "APPROVED";
  const showCheckOutButton = tab === "staying" && item.status === "CHECKED_IN";

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text
          style={{ fontSize: 16, fontWeight: "700", color: TEXT, flex: 1 }}
          numberOfLines={2}
        >
          Khách đặt: {item.name}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={{ color: MUTED, marginTop: 4 }}>
        Ngày đặt: {formatDateVN(item.when)}
      </Text>
      <View style={{ marginTop: 12 }}>
        <InfoRow label="Bài đăng" value={item.room} bold />
        <InfoRow label="SĐT" value={item.phone} />
        {item.note ? <InfoRow label="Ghi chú" value={item.note} /> : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18 }}>
        <ActionButton
          label="Xem"
          type="outline"
          onPress={handleView}
          style={{ marginRight: 10, marginBottom: 10 }}
        />
        {showApproveButton && (
          <ActionButton
            label="Duyệt"
            onPress={handleApprove}
            backgroundColor={SUCCESS}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}
        {showCancelButton && (
          <ActionButton
            label="Hủy"
            onPress={handleCancel}
            backgroundColor={CANCEL_RED}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}
        {showCheckInButton && (
          <ActionButton
            label="Check-in"
            onPress={handleCheckIn}
            backgroundColor={SUCCESS}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}
        {showCheckOutButton && (
          <ActionButton
            label="Trả phòng"
            onPress={handleCheckOut}
            backgroundColor={ORANGE}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}
      </View>
    </View>
  );
}

function StatusBadge({ status }) {
  const label = getBookingStatusLabel(status);
  const color = getBookingStatusColor(status);
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: hexToRgba(color, 0.16),
      }}
    >
      <Text style={{ color, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, bold, valueColor }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ color: MUTED, width: 90 }}>{label}</Text>
      <Text
        style={{
          color: valueColor || TEXT,
          fontWeight: bold ? "700" : "500",
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function hexToRgba(hex, alpha = 0.16) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let sanitized = hex.replace("#", "");
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(sanitized, 16);
  if (Number.isNaN(bigint)) return `rgba(0,0,0,${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}