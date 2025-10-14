import React, { useState } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import SelectDistrictModal from "../components/modal/SelectDistrictModal";
import { ADMIN_ALL_LABEL, isAllAdministrativeValue } from "../constants/administrative";


export default function TenantPanel({
  selectedCity,
  onSelectCity,
  selectedDistrict,
  onSelectDistrict,
  onUseLocation,
  locating,
  disableDistrictSelect,
}) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "tenant") return null;

  const navigation = useNavigation();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);


  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const selectedCityName = isAllAdministrativeValue(selectedCity)
    ? ADMIN_ALL_LABEL
    : provinces.find((p) => p.code === selectedCity)?.name_with_type || selectedCity;
  const selectedDistrictName = isAllAdministrativeValue(selectedDistrict)
    ? null
    : districts.find((d) => d.code === selectedDistrict)?.name_with_type;

  const handleSelectCity = (provinceCode) => {
    onSelectCity?.(provinceCode);
    setCityModalVisible(false);
  };

  const handleSelectDistrict = (districtCode) => {
    onSelectDistrict?.(districtCode);
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
          selectedDistrictName={selectedDistrictName}
          districtCode={selectedDistrict}
          onPressCity={() => setCityModalVisible(true)}
          onPressDistrict={() => {
            if (!disableDistrictSelect) {
              setDistrictModalVisible(true);
            }
          }}
          onPressUseLocation={onUseLocation}
          locating={locating}
          disableDistrictSelect={disableDistrictSelect}
          onPressSearch={({ provinceCode, districtCode }) =>
            navigation.navigate("SearchRooms", {
              provinceCode,
              districtCode,
              provinceName: provinceCode ? selectedCityName : undefined,
              districtName: districtCode
                ? districts.find((d) => d.code === districtCode)?.name_with_type
                : undefined,
            })
          }
        />
      </View>
    </View>
  );
}
