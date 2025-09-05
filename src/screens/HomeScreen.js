import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import ExploreSection from "../components/ExploreSection";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { locations } from '../data/locationData';
import { districtImages } from '../data/districtImages';

export default function HomeScreen() {
  const user = useSelector((s) => s.auth.user);
  const name = user?.fullName || user?.name || "";
  const [selectedCity, setSelectedCity] = useState("Hồ Chí Minh");

  const navigation = useNavigation();

  const districtItems = (locations[selectedCity] || []).map((district, index) => ({
    key: `${selectedCity}-${index}`,
    label: district,
    imageUri: districtImages[district],
  }));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{
        flexGrow: 1,
        // padding: 16,
        gap: 12,
        paddingBottom: 70,
      }}
    >
      <View style={{ backgroundColor: "#f36031", height: 150, paddingTop: 50 }}>
        <TouchableOpacity>
          <Ionicons
            name="notifications"
            size={30}
            color="#fff"
            style={{ alignSelf: "flex-end", paddingHorizontal: 20 }}
          />
        </TouchableOpacity>
        <View
          style={{ paddingLeft: 20, paddingBottom: 10, flexDirection: "row" }}
        >
          <TypingText
            text={`Xin chào, ${name}`}
            speed={150}
            pause={1000}
            style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}
          />
        </View>

      </View>
      <View style={{ marginTop: -40 }}>
        <LandlordPanel />
        <TenantPanel />
      </View>
      {/* component hiển thị panel theo role */}
      <ExploreSection
        title={`Khám phá ${selectedCity}`}
        items={districtItems}
        itemSize={150}
        onPressItem={(item) =>
          navigation.navigate("SearchRooms", { district: item.label })
        }
      />
    </ScrollView>
  );
}
