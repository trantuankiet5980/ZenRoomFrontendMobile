// src/screens/PaymentScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { fetchBookingById, payBooking } from "../features/bookings/bookingsThunks";

const ORANGE = "#f36031";
const BORDER = "#E5E7EB";

function formatCurrency(value) {
  if (value == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { bookingId, mode } = route.params || {}; // mode = "deposit" | "full"
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dispatch(fetchBookingById(bookingId)).unwrap();
        setBooking(res);
      } catch (err) {
        Alert.alert("Lỗi", err.message || "Không tải được thông tin booking");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch, bookingId]);

  const handlePay = async () => {
    try {
      const payload = { bookingId, type: mode }; // type = deposit hoặc full
      await dispatch(payBooking(payload)).unwrap();
      Alert.alert("Thành công", "Thanh toán thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", err.message || "Thanh toán thất bại");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!booking) return null;

  const total = booking.totalAmount || 0;
  const depositAmount = booking.depositAmount || total * 0.3; // giả sử 30%
  const payAmount = mode === "deposit" ? depositAmount : total;

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
        <Ionicons
          name="chevron-back"
          size={24}
          color="#111"
          onPress={() => navigation.goBack()}
        />
        <Text style={{ fontSize: 18, fontWeight: "700", flex: 1 }}>
          Thanh toán
        </Text>
      </View>

      {/* Booking info */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>
          {booking.property?.title}
        </Text>
        <Text style={{ marginTop: 4 }}>
          Ngày nhận phòng:{" "}
          <Text style={{ fontWeight: "600" }}>{booking.startDate}</Text>
        </Text>
        <Text style={{ marginTop: 2 }}>
          Ngày trả phòng:{" "}
          <Text style={{ fontWeight: "600" }}>{booking.endDate}</Text>
        </Text>

        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text style={{ marginBottom: 6 }}>
            Tổng số tiền:{" "}
            <Text style={{ fontWeight: "600" }}>
              {formatCurrency(total)}
            </Text>
          </Text>
          <Text style={{ marginBottom: 6 }}>
            Số tiền cần thanh toán:{" "}
            <Text style={{ fontWeight: "600", color: ORANGE }}>
              {formatCurrency(payAmount)}
            </Text>
          </Text>
          <Text style={{ color: "#6B7280" }}>
            {mode === "deposit"
              ? "Thanh toán tiền đặt cọc"
              : "Thanh toán toàn bộ"}
          </Text>
        </View>
      </View>

      {/* Pay button */}
      <View style={{ marginTop: "auto", padding: 16 }}>
        <TouchableOpacity
          onPress={handlePay}
          style={{
            backgroundColor: ORANGE,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            Xác nhận thanh toán
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
