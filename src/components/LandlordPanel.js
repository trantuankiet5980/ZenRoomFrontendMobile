import { useState } from "react";
import { View, Text } from "react-native";
import { useSelector } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import SelectDistrictModal from "../components/modal/SelectDistrictModal";
import { ADMIN_ALL_LABEL, isAllAdministrativeValue} from "../constants/administrative";

export default function LandlordPanel({
  selectedCity,
  onSelectCity,
  selectedDistrict,
  onSelectDistrict,
  onUseLocation,
  locating,
  disableDistrictSelect,
}) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "landlord") return null;

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

  const manageActions = [
    {
      key: "manage-posts",
      label: "Quản lý bài đăng",
      icon: "newspaper-variant-outline",
      iconLib: "mc",
      onPress: () => navigation.navigate("PostsManager"),
    },
    {
      key: "manage-tenants",
      label: "Quản lý khách thuê",
      icon: "account-group-outline",
      iconLib: "mc",
      onPress: () => navigation.navigate("TenantsManager"),
    },
    {
      key: "manage-contracts",
      label: "Quản lý hợp đồng",
      icon: "file-document-outline",
      iconLib: "mc",
      onPress: () => navigation.navigate("ContractsManager"),
    },
    {
      key: "create-contract",
      label: "Tạo hợp đồng",
      icon: "profile",
      iconLib: "ant",
      onPress: () => navigation.navigate("CreateContract"),
    },
  ];

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          backgroundColor: "#fff",
          padding: 12,
          marginHorizontal: 20,
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

      <View
        style={{
          backgroundColor: "#fff",
          padding: 12,
          marginHorizontal: 20,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>
          Quản lý cho thuê
        </Text>
        <ActionGrid items={manageActions} />
      </View>
    </View>
  );
}
