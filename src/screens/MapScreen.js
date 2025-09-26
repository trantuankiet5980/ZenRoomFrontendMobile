import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { MapView, Marker } from "expo-maps";  // ✅ thay react-native-maps

export default function MapScreen({ route, navigation }) {
  const { activeType } = route.params; 
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // ví dụ: data mẫu
    setMarkers([
      {
        propertyId: 1,
        title: "Điểm A",
        address: { latitude: 10.7769, longitude: 106.7009, addressFull: "Quận 1" },
      },
    ]);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialCamera={{
          center: { latitude: 10.7769, longitude: 106.7009 },
          zoom: 12,
        }}
      >
        {markers.map(m => (
          <Marker
            key={m.propertyId}
            coordinate={{
              latitude: m.address.latitude,
              longitude: m.address.longitude,
            }}
            title={m.title}
            onPress={() =>
              navigation.navigate("PropertyDetail", { propertyId: m.propertyId })
            }
          />
        ))}
      </MapView>
    </View>
  );
}
