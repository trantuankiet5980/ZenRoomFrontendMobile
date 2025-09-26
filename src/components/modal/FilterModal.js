import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#f36031";
const GRAY = "#E5E7EB";

export default function FilterModal({ visible, onClose, onApply }) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [capacity, setCapacity] = useState("");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "80%" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>Bộ lọc</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Giá */}
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Khoảng giá (VNĐ)</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TextInput
                placeholder="Tối thiểu"
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: GRAY, borderRadius: 8, padding: 8, marginRight: 6 }}
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <TextInput
                placeholder="Tối đa"
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: GRAY, borderRadius: 8, padding: 8 }}
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>

            {/* Diện tích */}
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Diện tích (m²)</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TextInput
                placeholder="Tối thiểu"
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: GRAY, borderRadius: 8, padding: 8, marginRight: 6 }}
                value={minArea}
                onChangeText={setMinArea}
              />
              <TextInput
                placeholder="Tối đa"
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: GRAY, borderRadius: 8, padding: 8 }}
                value={maxArea}
                onChangeText={setMaxArea}
              />
            </View>

            {/* Sức chứa */}
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Số người ở</Text>
            <TextInput
              placeholder="VD: 2"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: GRAY, borderRadius: 8, padding: 8, marginBottom: 20 }}
              value={capacity}
              onChangeText={setCapacity}
            />
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity
            style={{ backgroundColor: ORANGE, padding: 12, borderRadius: 10, alignItems: "center", marginTop: 8 }}
            onPress={() => {
              onApply({
                priceMin: minPrice ? Number(minPrice) : undefined,
                priceMax: maxPrice ? Number(maxPrice) : undefined,
                areaMin: minArea ? Number(minArea) : undefined,
                areaMax: maxArea ? Number(maxArea) : undefined,
                capacity: capacity ? Number(capacity) : undefined,
                // nếu muốn thêm: bedrooms, bathrooms, apartmentCategory, floorNo, roomNumber, buildingName ...
              });
              onClose();
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
