import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import { fetchProvinces, fetchDistricts } from "../features/administrative/administrativeThunks";
import { clearDistricts } from "../features/administrative/administrativeSlice";
import SelectDistrictModal from "../components/modal/SelectDistrictModal";


export default function TenantPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "tenant") return null;

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);


  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name_with_type || selectedCity;


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

  const handleSelectDistrict = (districtCode) => {
    setSelectedDistrict(districtCode);
    setDistrictModalVisible(false);
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
          selectedCity={selectedCityName}
          onSelectCity={handleSelectCity}
        />
        <SelectDistrictModal
          visible={districtModalVisible}
          onClose={() => setDistrictModalVisible(false)}
          districts={districts}
          onSelectDistrict={handleSelectDistrict}
        />
        <SearchPost
                  city={selectedCityName}
                  provinceCode={selectedCity}
                  selectedDistrictName={districts.find((d) => d.code === selectedDistrict)?.name_with_type}
                  districtCode={selectedDistrict}
                  onPressCity={() => setCityModalVisible(true)}
                  onPressDistrict={() => setDistrictModalVisible(true)}
                  onPressSearch={({ provinceCode, districtCode }) =>
                    navigation.navigate("SearchRooms", {
                      provinceCode,
                      districtCode,
                      provinceName: selectedCityName,
                      districtName: districts.find((d) => d.code === districtCode)?.name_with_type
                    })
                  }
                />
      </View>
    </View>
  );
}
