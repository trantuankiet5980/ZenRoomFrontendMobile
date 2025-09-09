import { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, FlatList } from "react-native";
import { useSelector } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";
import { locations } from "../data/locationData";
import SelectCityModal from "../components/modal/SelectCityModal";

export default function LandlordPanel({ selectedCity, setSelectedCity }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "landlord") return null;
  
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districts, setDistricts] = useState(locations[selectedCity] || []);

  const navigation = useNavigation();

  // Update districts mỗi khi selectedCity thay đổi
  useEffect(() => {
    setDistricts(locations[selectedCity] || []);
  }, [selectedCity]);

  const searchItem = {
    key: "search",
    label: "Tìm kiếm",
    icon: "search",
    iconLib: "ion",
    onPress: () => navigation.navigate("SearchRooms"), // TODO: tạo màn này
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
          onSelectCity={(city) => setSelectedCity(city)}
        />
        <SearchPost
          city={selectedCity}
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
