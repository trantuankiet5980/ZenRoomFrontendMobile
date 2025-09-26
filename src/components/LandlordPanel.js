import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import SelectCityModal from "../components/modal/SelectCityModal";
import { fetchProvinces, fetchDistricts } from "../features/administrative/administrativeThunks";
import { clearDistricts } from "../features/administrative/administrativeSlice";

export default function LandlordPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "landlord") return null;

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [cityModalVisible, setCityModalVisible] = useState(false);

  const provinces = useSelector((s) => s.administrative.provinces);
  const districts = useSelector((s) => s.administrative.districts);
  const selectedCityName = provinces.find(p => p.code === selectedCity)?.name || selectedCity;


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
      icon: "filetext1",
      iconLib: "ant",
      onPress: () => navigation.navigate("ContractsManager"),
    },
    {
      key: "create-contract",
      label: "Tạo hợp đồng",
      icon: "filetext1",
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
        <SearchPost
          city={selectedCityName}
          districts={districts}
          onPressCity={() => setCityModalVisible(true)}
          onPressSearch={() => navigation.navigate("SearchRooms")}
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
