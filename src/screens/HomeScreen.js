import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import ExploreSection from "../components/ExploreSection";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const user = useSelector((s) => s.auth.user);
  const name = user?.fullName || user?.name || "";

  const navigation = useNavigation();

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
      <View style={{ marginTop: -40}}>
        <LandlordPanel />
        <TenantPanel />
      </View>
      {/* component hiển thị panel theo role */}
      <ExploreSection
        title="Khám phá"
        items={[
          { key: '1',  label: '1' },
          { key: 'gv', label: 'Gò Vấp' },
          { key: '9',  label: '9' },
          { key: '12', label: '12' },
          { key: 'tp', label: 'Tân Phú' },
          { key: '3',  label: '3' },
          { key: '2',  label: '2' },
          { key: '7',  label: '7' },
          { key: '8',  label: '8' },
          { key: '10',  label: '10' },
          { key: '11',  label: '11' },
          { key: 'pv',  label: 'Phú Nhuận' },
        ]}
        itemSize={150}
        onPressItem={(item) => navigation.navigate('SearchRooms', { district: item.label })}
      />
    </ScrollView>
  );
}
