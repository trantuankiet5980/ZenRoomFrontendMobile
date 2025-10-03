import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import useHideTabBar from "../hooks/useHideTabBar";
import {
  fetchLandlordPendingBookings,
  fetchLandlordBookings,
  approveBooking,
  checkOutBooking,
} from "../features/bookings/bookingsThunks";

const ORANGE = "#f36031";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

const { width, height } = Dimensions.get("window");

export default function TenantsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");

  const { landlordPending = [], landlordBookings = [], loading } = useSelector(
    (state) => state.bookings
  );

  useEffect(() => {
    if (tab === "pending") {
      dispatch(fetchLandlordPendingBookings());
    } else {
      dispatch(fetchLandlordBookings());
    }
  }, [tab]);

  // Chuẩn hóa dữ liệu theo tab
  const tenants = useMemo(() => {
    switch (tab) {
      case "pending":
        return landlordPending.map((b) => ({
          id: b.bookingId,
          status: b.bookingStatus,
          name: b.tenant?.fullName,
          phone: b.tenant?.phone,
          room: b.property?.title,
          when: b.startDate,
          note: b.note,
        }));
      case "deposit":
        return landlordBookings
          .filter((b) => b.bookingStatus === "PENDING_PAYMENT")
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName,
            phone: b.tenant?.phone,
            room: b.property?.title,
            when: b.startDate,
            note: b.note,
          }));
      case "renting":
        return landlordBookings
          .filter(
            (b) =>
              b.bookingStatus === "APPROVED" ||
              b.bookingStatus === "CHECKED_IN"
          )
          .map((b) => ({
            id: b.bookingId,
            status: b.bookingStatus,
            name: b.tenant?.fullName,
            phone: b.tenant?.phone,
            room: b.property?.title,
            when: b.startDate,
            note: b.note,
          }));
      default:
        return [];
    }
  }, [tab, landlordPending, landlordBookings]);

  // lọc search
  const filtered = useMemo(() => {
    if (!q) return tenants;
    const needle = q.toLowerCase();
    return tenants.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(needle) ||
        (t.phone || "").toLowerCase().includes(needle) ||
        (t.room || "").toLowerCase().includes(needle)
    );
  }, [tenants, q]);

  const pendingCount = landlordPending.length;

  const renderItem = ({ item }) => (
    <TenantCard item={item} tab={tab} dispatch={dispatch} />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={{
          height: height * 0.08,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: width * 0.03,
          marginTop: height * 0.04,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 4 }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color="#111" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: width * 0.05,
            fontWeight: "700",
            flex: 1,
          }}
        >
          Quản lý khách thuê
        </Text>
      </View>

      {/* Search */}
      <View
        style={{
          margin: width * 0.04,
          height: height * 0.06,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: BORDER,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: width * 0.03,
        }}
      >
        <Ionicons name="search" size={width * 0.045} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nhập thông tin tìm kiếm"
          placeholderTextColor={MUTED}
          style={{ marginLeft: width * 0.02, flex: 1, fontSize: width * 0.04 }}
        />
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: width * 0.04,
          flexWrap: "wrap",
        }}
      >
        <Tab
          label={`Chờ duyệt${pendingCount ? `(${pendingCount})` : ""}`}
          active={tab === "pending"}
          onPress={() => setTab("pending")}
        />
        <Tab
          label="Đã đặt cọc"
          active={tab === "deposit"}
          onPress={() => setTab("deposit")}
        />
        <Tab
          label="Đang thuê"
          active={tab === "renting"}
          onPress={() => setTab("renting")}
        />
      </View>
      <View
        style={{ height: 2, backgroundColor: BORDER, marginTop: height * 0.01 }}
      />

      {/* List / Empty */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#111" }}>Chưa có dữ liệu</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: width * 0.04, paddingBottom: height * 0.03 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

/* ----- Sub components ----- */
function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingVertical: height * 0.015, marginRight: width * 0.04 }}
    >
      <Text style={{ fontWeight: "700", color: active ? ORANGE : MUTED }}>
        {label}
      </Text>
      <View
        style={{
          height: 3,
          marginTop: height * 0.01,
          backgroundColor: active ? ORANGE : "transparent",
          borderRadius: 2,
        }}
      />
    </TouchableOpacity>
  );
}

function TenantCard({ item, tab, dispatch }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: width * 0.03,
        marginBottom: height * 0.015,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: width * 0.045 }}>{item.name}</Text>
        <Text style={{ color: "#6B7280", fontSize: width * 0.04 }}>{item.phone}</Text>
      </View>
      <Text style={{ marginTop: height * 0.008, fontSize: width * 0.042 }}>
        Phòng: <Text style={{ fontWeight: "600" }}>{item.room}</Text>
      </Text>
      {!!item.when && (
        <Text style={{ marginTop: height * 0.005, color: "#6B7280", fontSize: width * 0.038 }}>
          Ngày: {item.when}
        </Text>
      )}
      {!!item.note && (
        <Text style={{ marginTop: height * 0.005, color: "#6B7280", fontSize: width * 0.038 }}>
          {item.note}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: width * 0.02, marginTop: height * 0.012 }}>
        {tab === "pending" && (
          <TouchableOpacity
            onPress={async () => {
              try {
                await dispatch(approveBooking(item.id)).unwrap();
                alert("Duyệt thành công, hợp đồng đã tạo.");
              } catch (e) {
                alert("Có lỗi: " + e.message);
              }
            }}
            style={{
              paddingHorizontal: width * 0.04,
              paddingVertical: height * 0.012,
              borderRadius: 8,
              backgroundColor: ORANGE,
            }}
          >
            <Text style={{ color: "#fff", fontSize: width * 0.04 }}>Duyệt</Text>
          </TouchableOpacity>
        )}

        {tab === "renting" && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              try {
                await dispatch(checkOutBooking(item.id)).unwrap();
                alert("Thanh toán & trả phòng thành công.");
              } catch (e) {
                alert("Có lỗi: " + e.message);
              }
            }}
            style={{
              paddingHorizontal: width * 0.04,
              paddingVertical: height * 0.012,
              borderRadius: 8,
              backgroundColor: ORANGE,
            }}
          >
            <Text style={{ color: "#fff", fontSize: width * 0.04 }}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
