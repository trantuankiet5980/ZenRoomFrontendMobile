import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchPost({
  city,                     // tên hiển thị
  provinceCode,             // code thật
  selectedDistrictName,     // tên hiển thị
  districtCode,             // code thật
  onPressCity,
  onPressDistrict,
  onPressSearch,
}) {
  return (
    <View style={{ gap: 12 }}>
      {/* Hàng chọn tỉnh & quận */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        {/* Chọn tỉnh */}
        <TouchableOpacity
          onPress={onPressCity}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f4f4f4",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="location-outline" size={18} color="#333" />
          <Text style={{ marginLeft: 6, fontSize: 14 }}>
            {city || "Chọn Tỉnh/Thành phố"}
          </Text>
        </TouchableOpacity>

        {/* Chọn quận/huyện */}
        <TouchableOpacity
          onPress={onPressDistrict}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f4f4f4",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="business-outline" size={18} color="#333" />
          <Text style={{ marginLeft: 6, fontSize: 14 }}>
            {selectedDistrictName || "Chọn Quận/Huyện"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nút tìm kiếm */}
      <TouchableOpacity
        onPress={() =>
          onPressSearch({ provinceCode, districtCode })
        }
        style={{
          backgroundColor: "#f36031",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
          Tìm phòng
        </Text>
      </TouchableOpacity>
    </View>
  );
}

