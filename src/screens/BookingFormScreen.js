import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch } from "react-redux";
import { createBooking } from "../features/bookings/bookingsThunks";
import { recordUserEvent } from "../features/events/eventsThunks";

const ORANGE = "#f36031";

export default function BookingForm({ route, navigation }) {
  const { property } = route.params;
  const dispatch = useDispatch();

  const [checkInAt, setCheckInAt] = useState(new Date());
  const [checkOutAt, setCheckOutAt] = useState(new Date());
  const [note, setNote] = useState("");

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);

  function toLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000; // mili giây
    const localISO = new Date(date - tzOffset).toISOString().slice(0, -1);
    return localISO;
  }

  const handleBooking = async () => {
    try {
      const checkInIso = toLocalISOString(checkInAt);
      const checkOutIso = toLocalISOString(checkOutAt);
      await dispatch(
        createBooking({
          propertyId: property.propertyId,
          checkInAt: checkInIso,
          checkOutAt: checkOutIso,
          note,
        })
      ).unwrap();
      
      alert("Đặt phòng thành công!");
      dispatch(
        recordUserEvent({
          eventType: "BOOKING",
          roomId: property.propertyId,
          metadata: {
            checkInAt: checkInIso,
            checkOutAt: checkOutIso,
            source: "booking_form",
          },
        })
      );
      navigation.goBack();
    } catch (err) {
      alert(err?.message || "Đặt phòng thất bại");
    }
  };



  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 12 }}>
        Đặt phòng: {property.title}
      </Text>

      {/* Ngày nhận phòng */}
      <Text>Ngày nhận phòng</Text>
      <TouchableOpacity
        onPress={() => setShowCheckIn(true)}
        style={{ padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginVertical: 6 }}
      >
        <Text>{checkInAt.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showCheckIn && (
        <DateTimePicker
          value={checkInAt}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowCheckIn(Platform.OS === "ios"); // iOS giữ mở
            if (date) setCheckInAt(date);
          }}
        />
      )}

      {/* Ngày trả phòng */}
      <Text>Ngày trả phòng</Text>
      <TouchableOpacity
        onPress={() => setShowCheckOut(true)}
        style={{ padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginVertical: 6 }}
      >
        <Text>{checkOutAt.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showCheckOut && (
        <DateTimePicker
          value={checkOutAt}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowCheckOut(Platform.OS === "ios");
            if (date) setCheckOutAt(date);
          }}
        />
      )}

      {/* Ghi chú */}
      <Text>Ghi chú</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Nhập ghi chú..."
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginVertical: 12 }}
      />

      {/* Button đặt phòng */}
      <TouchableOpacity
        style={{ backgroundColor: ORANGE, padding: 12, borderRadius: 8, alignItems: "center" }}
        onPress={handleBooking}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Xác nhận đặt phòng</Text>
      </TouchableOpacity>
    </View>
  );
}
