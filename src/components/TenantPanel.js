import { View } from "react-native";
import { useSelector } from "react-redux";
import ActionGrid from "./ActionGrid";
import SearchPost from "./SearchPost";
import { useNavigation } from "@react-navigation/native";

export default function TenantPanel() {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== "tenant") return null;
  //thêm gì cho role tenant thì thêm ở đây
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
        <SearchPost
          city="Hồ Chí Minh"
          onPressCity={() => console.log("Chọn địa điểm")}
          onPressSearch={() => navigation.navigate("SearchRooms")}
        />
      </View>
    </View>
  );
}
