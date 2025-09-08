import { ScrollView, View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import TypingText from "../hooks/TypingText";
import LandlordPanel from "../components/LandlordPanel";
import TenantPanel from "../components/TenantPanel";
import ExploreSection from "../components/ExploreSection";
import ListingCarouselSection from "../components/ListtingCarouselSection";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { locations } from '../data/locationData';
import { districtImages } from '../data/districtImages';

import RoomLists from "../components/RoomLists";
import { uyTinRooms, cheapRooms } from "../data/rooms";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const user = useSelector((s) => s.auth.user);
  const name = user?.fullName || user?.name || "";
  const [selectedCity, setSelectedCity] = useState("Hồ Chí Minh");

  const navigation = useNavigation();

  const districtItems = (locations[selectedCity] || []).map((district, index) => ({
    key: `${selectedCity}-${index}`,
    label: district,
    imageUri: districtImages[district],
  }));

  // data giả room
  const cheapAll = [
    { id:'r1', image:'https://picsum.photos/seed/room1/600/400', title:'PHÒNG CHO THUÊ CHUNG CƯ GIÁ RẺ TẠI GÒ VẤP', priceText:'Từ 3.500.000đ/tháng', address:'12 Nguyễn Văn Nghi', district:'Gò Vấp', available:1, isGoodDeal:true },
    { id:'r2', image:'https://picsum.photos/seed/room2/600/400', title:'PHÒNG GIÁ RẺ, GẦN ĐH CÔNG NGHIỆP',          priceText:'Từ 3.400.000đ/tháng', address:'45 Phan Văn Trị',   district:'Gò Vấp', available:2, isGoodDeal:true },
    { id:'r3', image:'https://picsum.photos/seed/room3/600/400', title:'CĂN MINI CHO THUÊ KHU TÂN BÌNH',            priceText:'Từ 3.600.000đ/tháng', address:'9 Trường Chinh',   district:'Tân Bình', available:1, isGoodDeal:true },
  ];
  const cheapVisible = cheapAll.slice(0,2);

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
        <LandlordPanel
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
        />
        <TenantPanel
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
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

      <TouchableOpacity
        onPress={() => navigation.navigate("SearchRooms")}
        style={{ alignItems: "center", marginHorizontal: 20, marginVertical: 20 }}
      >
        <Image
          source={require("../../assets/images/datPhong.png")} 
          style={{ height: 300,  width: screenWidth - 40, resizeMode: "cover", borderRadius: 15, }}
        />
      </TouchableOpacity>
      {/* <View style={{ height: 130, backgroundColor: '#f36031', marginHorizontal: 20, marginTop: 8, marginBottom: 4, borderRadius: 15 }}>
      </View> */}

      {/* Section “Phòng giá rẻ”: có 3 item nhưng chỉ render 2 */}
      <ListingCarouselSection
        title="Phòng giá rẻ"
        icon="bag-outline"
        items={cheapVisible}
        onPressItem={(it) => navigation.navigate('SearchRooms', { preset:'cheap', id: it.id })}
        onPressMore={() => navigation.navigate('SearchRooms', { preset:'cheap', seed: cheapAll })}
        onPressSeeAll={() => navigation.navigate('SearchRooms', { preset:'cheap', seed: cheapAll })}
      />
      <View style={{ height: 130, backgroundColor: '#f36031', marginHorizontal: 20, marginTop: 8, marginBottom: 4, borderRadius: 15 }}>
      </View>
    </ScrollView>
  );
}
