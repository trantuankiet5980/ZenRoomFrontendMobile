import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import { fetchProvinces, fetchDistricts } from "../features/administrative/administrativeThunks";
import SelectDistrictModal from "../components/modal/SelectDistrictModal";

export default function LandlordPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "landlord") return null;

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name_with_type || selectedCity;


  // Load provinces khi mount
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
