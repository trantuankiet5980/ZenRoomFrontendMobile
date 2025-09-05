import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { locations } from "../../data/locationData";

export default function SelectCityModal({ visible, onClose, onSelectCity }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            maxHeight: "60%",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
            Chọn Tỉnh/Thành phố
          </Text>

          <FlatList
            data={Object.keys(locations)}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
                onPress={() => {
                  onSelectCity(item);
                  onClose();
                }}
              >
                <Text style={{ fontSize: 15 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={onClose}>
            <Text
              style={{
                color: "#f36031",
                fontWeight: "600",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Đóng
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
