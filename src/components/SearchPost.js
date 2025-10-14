import React from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_ALL_LABEL, isAllAdministrativeValue } from "../constants/administrative";

export default function SearchPost({
  city,                     // tên hiển thị
  provinceCode,             // code thật
  selectedDistrictName,     // tên hiển thị
  districtCode,             // code thật
  onPressCity,
  onPressDistrict,
  onPressSearch,
  onPressUseLocation,
  locating,
  disableDistrictSelect,
}) {
  const normalizedCityLabel = city || (isAllAdministrativeValue(provinceCode) ? ADMIN_ALL_LABEL : "Chọn Tỉnh/Thành phố");
  const normalizedDistrictLabel =
    selectedDistrictName ||
    (isAllAdministrativeValue(districtCode) ? ADMIN_ALL_LABEL : "Chọn Quận/Huyện");
  const isDistrictDisabled = disableDistrictSelect || isAllAdministrativeValue(provinceCode);

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
            {normalizedCityLabel}
          </Text>
        </TouchableOpacity>

        {/* Chọn quận/huyện */}
        <TouchableOpacity
          onPress={onPressDistrict}
          disabled={isDistrictDisabled}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f4f4f4",
            padding: 10,
            borderRadius: 8,
            opacity: isDistrictDisabled ? 0.5 : 1,
          }}
        >
          <Ionicons name="business-outline" size={18} color="#333" />
          <Text style={{ marginLeft: 6, fontSize: 14 }}>
            {normalizedDistrictLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {onPressUseLocation && (
        <TouchableOpacity
          onPress={onPressUseLocation}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="navigate-circle-outline" size={18} color="#f36031" />
          <Text style={{ color: "#f36031", fontWeight: "600" }}>
            Sử dụng vị trí của tôi
          </Text>
          {locating && <ActivityIndicator size="small" color="#f36031" />}
        </TouchableOpacity>
      )}

      {/* Nút tìm kiếm */}
      <TouchableOpacity
        onPress={() =>
          onPressSearch({
            provinceCode: isAllAdministrativeValue(provinceCode)
              ? undefined
              : provinceCode,
            districtCode: isAllAdministrativeValue(districtCode)
              ? undefined
              : districtCode,
          })
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

