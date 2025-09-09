import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const ORANGE = "#f36031";
const TEXT_MUTED = "#6B7280";

const OPTIONS = [
  { key: "new", label: "Tin mới", icon: <Ionicons name="information-circle" size={18} color="#2563EB" /> },
  { key: "desc", label: "Giá từ cao tới thấp", icon: <MaterialIcons name="attach-money" size={18} color="#EA580C" /> },
  { key: "asc", label: "Giá từ thấp tới cao", icon: <MaterialIcons name="money" size={18} color="#16A34A" /> },
];

export default function SortModal({ visible, onClose, onSort, selected }) {
  const [current, setCurrent] = useState(selected || "new");

  const handleApply = () => {
    onSort(current);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} />
      </TouchableWithoutFeedback>

      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 20,
          position: "absolute",
          bottom: 0,
          width: "100%",
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#ccc", borderRadius: 2 }} />
        </View>
        <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 16 }}>Sắp xếp theo</Text>

        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setCurrent(opt.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {opt.icon}
              <Text>{opt.label}</Text>
            </View>
            <Ionicons
              name={current === opt.key ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={current === opt.key ? ORANGE : TEXT_MUTED}
            />
          </Pressable>
        ))}

        {/* Nút action */}
        <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>
          <Pressable
            onPress={() => setCurrent("new")}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ccc",
              backgroundColor: "#f5f5f5",
            }}
          >
            <Text style={{ textAlign: "center" }}>Làm mới</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: ORANGE,
            }}
          >
            <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>
              Áp dụng
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
