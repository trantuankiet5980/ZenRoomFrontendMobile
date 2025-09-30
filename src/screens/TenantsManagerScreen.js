import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
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

export default function TenantsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");

  const { landlordPending = [], landlordAll = [], loading } = useSelector(
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
          status: "pending",
          name: b.tenant?.fullName,
          phone: b.tenant?.phone,
          room: b.property?.title,
          when: b.startDate,
          note: b.note,
        }));
      case "approved":
        return (landlordAll || [])
          .filter((b) => b.bookingStatus === "APPROVED")
          .map((b) => ({
            id: b.bookingId,
            status: "approved",
            name: b.tenant?.fullName,
            phone: b.tenant?.phone,
            room: b.property?.title,
            when: b.startDate,
            note: b.note,
          }));
      case "deposit":
        return (landlordAll || [])
          .filter((b) => b.bookingStatus === "PENDING")
          .map((b) => ({
            id: b.bookingId,
            status: "deposit",
            name: b.tenant?.fullName,
            phone: b.tenant?.phone,
            room: b.property?.title,
            when: b.startDate,
            note: b.note,
          }));
      case "renting":
        return (landlordAll || [])
          .filter((b) => b.bookingStatus === "APPROVED")
          .map((b) => ({
            id: b.bookingId,
            status: "renting",
            name: b.tenant?.fullName,
            phone: b.tenant?.phone,
            room: b.property?.title,
            when: b.startDate,
            note: b.note,
          }));
      default:
        return [];
    }
  }, [tab, landlordPending, landlordAll]);

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
  const approvedCount = (landlordAll || []).filter(
    (b) => b.bookingStatus === "APPROVED"
  ).length;

  const renderItem = ({ item }) => (
    <TenantCard item={item} tab={tab} dispatch={dispatch} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          marginTop: 30,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", flex: 1 }}>
          Quản lý khách thuê
        </Text>
        <TouchableOpacity
          onPress={() => console.log("Open calendar")}
          style={{ padding: 6 }}
        >
          <Ionicons name="calendar-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={{
          margin: 16,
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: BORDER,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nhập thông tin tìm kiếm"
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1 }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, flexWrap: "wrap" }}>
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
      <View style={{ height: 2, backgroundColor: BORDER, marginTop: 8 }} />

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
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

/* ----- Sub components ----- */
function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingVertical: 10, marginRight: 18 }}
    >
      <Text style={{ fontWeight: "700", color: active ? ORANGE : MUTED }}>
        {label}
      </Text>
      <View
        style={{
          height: 3,
          marginTop: 8,
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
        padding: 12,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700" }}>{item.name}</Text>
        <Text style={{ color: "#6B7280" }}>{item.phone}</Text>
      </View>
      <Text style={{ marginTop: 6 }}>
        Phòng: <Text style={{ fontWeight: "600" }}>{item.room}</Text>
      </Text>
      {!!item.when && (
        <Text style={{ marginTop: 4, color: "#6B7280" }}>Ngày: {item.when}</Text>
      )}
      {!!item.note && (
        <Text style={{ marginTop: 4, color: "#6B7280" }}>{item.note}</Text>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => console.log("Chi tiết", item.id)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text>Xem</Text>
        </TouchableOpacity>

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
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: "#fff" }}>Duyệt</Text>
          </TouchableOpacity>
        )}

        {tab === "renting" && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => dispatch(checkOutBooking(item.id))}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: ORANGE,
            }}
          >
            <Text style={{ color: "#fff" }}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
