import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchConversations,
  fetchUnreadCount,
  setTab as setTabAction,
  setSearch as setSearchAction,
} from "../features/chat/chatThunks";

const ORANGE = "#f36031", MUTED = "#9CA3AF", BORDER = "#E5E7EB", GREEN = "#CBE7A7";

/** Helper: xác định "đối tác" trong hội thoại (người còn lại) */
function getOtherParty(conv, meId) {
  if (!conv) return null;
  const { tenant, landlord } = conv;
  if (tenant?.userId === meId) return landlord || null;
  if (landlord?.userId === meId) return tenant || null;
  return landlord || tenant || null; // fallback
}

export default function ChatListScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Lấy user hiện tại từ auth
  const { userId: meId } = useSelector(s => s.auth || {});

  const { conversations, convLoading } = useSelector(s => s.chat);
  const [tab, setTab] = useState("all");       // 'all' | 'tenant'
  const [q, setQ] = useState("");

  // Fetch khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchConversations()).unwrap()
        .then(list => {
          // gọi unread cho từng hội thoại (song song)
          list.forEach(c => dispatch(fetchUnreadCount(c.conversationId)));
        })
        .catch(() => {});
    }, [dispatch])
  );

  // Map data hiển thị: tên người còn lại, avatar, last (nếu có), unread
  const data = useMemo(() => {
    const base = Array.isArray(conversations) ? conversations : [];
    const filteredByTab = tab === "tenant"
      ? base.filter(c => Boolean(c?.tenant))
      : base;

    const mapped = filteredByTab.map(c => {
      const other = getOtherParty(c, meId);
      return {
        id: c.conversationId,
        name: other?.fullName || "Người dùng",
        avatar: other?.avatarUrl || null,
        time: new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unread: c.unread || 0,
        raw: c,
      };
    });

    if (!q) return mapped;
    const s = q.toLowerCase();
    return mapped.filter(x =>
      x.name.toLowerCase().includes(s)
      // Bạn có thể thêm filter theo last message nếu BE trả về
    );
  }, [conversations, tab, q, meId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate("ChatDetail", {
        conversationId: item.id,
        title: item.name,
        avatar: item.avatar,
      })}
      style={{
        marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: "#fff",
        shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, padding: 12,
        flexDirection: "row", alignItems: "center"
      }}
    >
      <Avatar uri={item.avatar} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "700" }} numberOfLines={1}>{item.name}</Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>{item.time}</Text>
        </View>
        {/* Nếu muốn hiện last preview, cần BE trả; tạm bỏ hoặc bạn tự map */}
        {/* <Text style={{ color: MUTED, marginTop: 4 }} numberOfLines={1}>{item.last || ""}</Text> */}
      </View>

      {/* Badge chỉ hiện với unread > 0 (phía bạn) */}
      {item.unread > 0 && (
        <View style={{
          marginLeft: 8, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE,
          alignItems: "center", justifyContent: "center", paddingHorizontal: 6
        }}>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
      {/* Header */}
      <View style={{ paddingTop: 30, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F2F2F2" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", flex: 1 }}>Tin nhắn</Text>
          <Ionicons name="search" size={20} color="#111" />
        </View>

        {/* Tabs */}
        <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
          <TabPill label="Tất cả" active={tab === "all"} onPress={() => setTab("all")} />
          <TabPill label="Khách thuê" active={tab === "tenant"} onPress={() => setTab("tenant")} />
        </View>

        {/* Search box */}
        <View style={{
          marginTop: 10, height: 40, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
          flexDirection: "row", alignItems: "center", paddingHorizontal: 10
        }}>
          <Ionicons name="search" size={16} color={MUTED} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm theo tên…"
            placeholderTextColor={MUTED}
            style={{ marginLeft: 8, flex: 1 }}
          />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
        refreshing={!!convLoading}
        onRefresh={() => {
          dispatch(fetchConversations()).unwrap()
            .then(list => list.forEach(c => dispatch(fetchUnreadCount(c.conversationId))))
            .catch(() => {});
        }}
      />
    </View>
  );
}

function TabPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: active ? GREEN : "#F2F4F5",
      }}>
      <Text style={{ fontWeight: "700", color: active ? "#2E7D32" : "#111" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Avatar({ uri }) {
  if (!uri) {
    return (
      <View style={{
        width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFE1E1",
        alignItems: "center", justifyContent: "center"
      }}>
        <Ionicons name="person" size={22} color="#E26666" />
      </View>
    );
  }
  return <Image source={{ uri }} style={{ width: 42, height: 42, borderRadius: 21 }} />;
}
