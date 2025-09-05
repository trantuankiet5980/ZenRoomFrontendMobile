import React, { useState,useEffect } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import { locations } from "../data/locationData";

export default function TenantPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "tenant") return null;

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districts, setDistricts] = useState(locations[selectedCity] || []);

  // Update districts khi selectedCity thay đổi
  useEffect(() => {
    setDistricts(locations[selectedCity] || []);
  }, [selectedCity]);

  const navigation = useNavigation();

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          backgroundColor: "#fff",
          padding: 12,
          marginHorizontal: 16,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <SelectCityModal
          visible={cityModalVisible}
          onClose={() => setCityModalVisible(false)}
          onSelectCity={(city) => setSelectedCity(city)}
        />
        <SearchPost
          city={selectedCity}
          districts={districts}
          onPressCity={() => setCityModalVisible(true)}
          onPressSearch={() => navigation.navigate("SearchRooms")}
        />
      </View>
    </View>
  );
}

