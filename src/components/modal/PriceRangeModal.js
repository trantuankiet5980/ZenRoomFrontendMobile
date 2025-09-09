import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

const ORANGE = "#f36031";

export default function PriceRangeModal({ visible, onClose, priceRange, setPriceRange }) {
  const [localRange, setLocalRange] = useState(priceRange);

  const handleApply = () => {
    setPriceRange(localRange);
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
        <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 16 }}>
          Khoảng giá
        </Text>

        <Text style={{ marginBottom: 10, color: "#555" }}>
          Giá từ {localRange[0].toLocaleString()}đ đến {localRange[1].toLocaleString()}đ
        </Text>

        <MultiSlider
          values={localRange}
          min={0}
          max={20000000}
          step={500000}
          onValuesChange={(val) => setLocalRange(val)}
          selectedStyle={{ backgroundColor: ORANGE }}
          markerStyle={{
            backgroundColor: "#fff",
            borderColor: ORANGE,
            borderWidth: 2,
            height: 20,
            width: 20,
          }}
        />

        {/* Nút action */}
        <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>
          <Pressable
            onPress={() => setLocalRange([0, 20000000])}
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
