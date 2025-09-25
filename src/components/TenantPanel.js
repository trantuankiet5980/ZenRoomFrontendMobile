import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import { fetchProvinces, fetchDistricts } from "../features/administrative/administrativeThunks";
import { clearDistricts } from "../features/administrative/administrativeSlice";

export default function TenantPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "tenant") return null;

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [cityModalVisible, setCityModalVisible] = useState(false);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
const selectedCityName = provinces.find(p => p.code === selectedCity)?.name || selectedCity;


  // Load provinces khi component mount
  useEffect(() => {
    dispatch(fetchProvinces());
  }, [dispatch]);

  // Khi chọn tỉnh -> load districts từ BE
  const handleSelectCity = (provinceCode) => {
    setSelectedCity(provinceCode);
    dispatch(fetchDistricts(provinceCode));
    setCityModalVisible(false);
  };

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
          provinces={provinces}
          districts={districts}
          selectedCity={ selectedCityName}
          onSelectCity={handleSelectCity}
        />
        <SearchPost
          city={selectedCityName}
          districts={districts}
          onPressCity={() => setCityModalVisible(true)}
          onPressSearch={() => navigation.navigate("SearchRooms")}
        />
      </View>
    </View>
  );
}
