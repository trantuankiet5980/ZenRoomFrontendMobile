import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyPendingBookings,
  fetchMyApprovedBookings,
  cancelBooking
} from "../features/bookings/bookingsThunks";

import useHideTabBar from "../hooks/useHideTabBar";

const ORANGE = "#f36031";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

function formatDateVN(dateString) {
  if (!dateString) return "";

  // Nếu không có timezone thì thêm 'Z' để tránh NaN
  let safeDate = dateString;
  if (!dateString.includes("Z") && !dateString.includes("+")) {
    safeDate = dateString + "Z";
  }

  const d = new Date(safeDate);
  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}



export default function MyBookingsScreen() {
  useHideTabBar();
  const dispatch = useDispatch();
  const { myPending, myApproved } = useSelector(s => s.bookings);
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (tab === "pending") {
      dispatch(fetchMyPendingBookings());
    } else {
      dispatch(fetchMyApprovedBookings());
    }
  }, [dispatch, tab]);


  const list = tab === "pending" ? myPending : myApproved;
  const filtered = useMemo(() => {
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(b =>
      (b.property?.title || "").toLowerCase().includes(needle) ||
      (b.note || "").toLowerCase().includes(needle)
    );
  }, [list, q]);


  const pendingCount = myPending?.length || 0;
  const approvedCount = myApproved?.length || 0;


  const handleCancel = async (bookingId) => {
    try {
      await dispatch(cancelBooking(bookingId)).unwrap();
      alert("Hủy booking thành công");
    } catch (err) {
      alert(err?.message || "Hủy booking thất bại");
    }
  };

  const renderItem = ({ item }) => <BookingCard item={item} tab={tab} onCancel={handleCancel} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Ionicons name="chevron-back" size={24} color="#111" onPress={() => null} />
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>Booking của tôi</Text>
      </View>

      {/* Search */}
      <View style={{ margin: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: BORDER, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm kiếm theo phòng hoặc ghi chú"
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1 }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        <Tab label={`Đang chờ duyệt${pendingCount ? `(${pendingCount})` : ''}`} active={tab === 'pending'} onPress={() => setTab('pending')} />
        <Tab label={`Đã duyệt${approvedCount ? `(${approvedCount})` : ''}`} active={tab === 'approved'} onPress={() => setTab('approved')} />
      </View>
      <View style={{ height: 2, backgroundColor: BORDER, marginTop: 8 }} />

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ color: '#111' }}>Chưa có booking</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.bookingId}
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
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, marginRight: 18 }}>
      <Text style={{ fontWeight: '700', color: active ? ORANGE : MUTED }}>{label}</Text>
      <View style={{ height: 3, marginTop: 8, backgroundColor: active ? ORANGE : 'transparent', borderRadius: 2 }} />
    </TouchableOpacity>
  );
}

function BookingCard({ item, tab, onCancel }) {
  return (
    <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700' }}>{item.property?.title}</Text>
        <Text style={{ color: '#6B7280' }}>{item.status}</Text>
      </View>
      <Text style={{ marginTop: 6 }}>
        Check-in: <Text style={{ fontWeight: '600' }}>{formatDateVN(item.startDate)}</Text>
      </Text>
      <Text style={{ marginTop: 2 }}>
        Check-out: <Text style={{ fontWeight: '600' }}>{formatDateVN(item.endDate)}</Text>
      </Text>

      {item.note ? <Text style={{ marginTop: 4, color: '#6B7280' }}>Ghi chú: {item.note}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity onPress={() => { }} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}>
          <Text>Xem</Text>
        </TouchableOpacity>

        {tab === 'pending' && (
          <TouchableOpacity onPress={() => onCancel(item.bookingId)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}>
            <Text style={{ color: '#fff' }}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
