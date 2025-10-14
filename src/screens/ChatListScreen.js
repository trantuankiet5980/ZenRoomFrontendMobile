import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversations, fetchUnreadCount } from "../features/chat/chatThunks";
import { getClient, ensureConnected, isConnected } from "../sockets/socket";
import { pushServerMessage } from "../features/chat/chatSlice";
import { formatRelativeTime } from "../utils/time";

const ORANGE = "#f36031", MUTED = "#9CA3AF", BORDER = "#E5E7EB", GREEN = "#CBE7A7";

function getOtherParty(conv, meId, meRole) {
  if (!conv) return null;
  const { tenant, landlord } = conv;

  // Nếu tôi là landlord → lấy tenant
  if (meRole === "LANDLORD") return tenant || null;

  // Nếu tôi là tenant → lấy landlord
  if (meRole === "TENANT") return landlord || null;

  // fallback
  if (tenant?.userId === meId) return landlord || null;
  if (landlord?.userId === meId) return tenant || null;
  return landlord || tenant || null;
}


export default function ChatListScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const me = useSelector(s => s.auth?.user);
  const { conversations, convLoading } = useSelector(s => s.chat);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  // giữ subscriptions theo convId để không subscribe lặp
  const subsRef = useRef({}); // { [convId]: subscription }

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchConversations()).unwrap()
        .then(list => list.forEach(c => dispatch(fetchUnreadCount(c.conversationId))))
        .catch(() => {});
    }, [dispatch])
  );

  // subscribe tất cả hội thoại hiện có, nhận realtime lastMessage + unread
  useEffect(() => {
    const toSub = (cid) => {
      const client = getClient();
      if (!client?.connected || subsRef.current[cid]) return; // đã có
      const sub = client.subscribe(`/topic/chat.${cid}`, (msg) => {
        try {
          const dto = JSON.parse(msg.body);
          dispatch(pushServerMessage({ ...dto, __currentUserId: me?.userId }));
        } catch {}
      });
      subsRef.current[cid] = sub;
    };

    const doSubscribeAll = () => {
      (conversations || []).forEach(c => toSub(c.conversationId));
    };

    if (isConnected()) {
      doSubscribeAll();
    } else {
      ensureConnected(() => doSubscribeAll(), "chat-list-bulk");
    }

    return () => {

    };
  }, [conversations]);

  const data = useMemo(() => {
    const base = Array.isArray(conversations) ? conversations : [];
    const filtered = tab === "tenant" ? base.filter(c => Boolean(c?.tenant)) : base;

  const mapped = filtered.map((c) => {
      const other = getOtherParty(c, me?.userId, me?.role);
      const lastTimeIso =
        c.lastMessageAt ||
        c.updatedAt ||
        c.lastMessage?.createdAt ||
        c.createdAt ||
        null;
      return {
        id: c.conversationId,
        name: other?.fullName || (other?.role === "TENANT" ? "Khách thuê" : "Chủ trọ"),
        avatar: other?.avatarUrl || null,
        time: formatRelativeTime(lastTimeIso),
        unread: c.unread || 0,
        last: c.lastMessage || "",
        raw: c,
        lastTimeIso,
      };
    });

    const sorted = [...mapped].sort((a, b) => {
      const timeA = a.lastTimeIso ? new Date(a.lastTimeIso).getTime() : 0;
      const timeB = b.lastTimeIso ? new Date(b.lastTimeIso).getTime() : 0;
      return timeB - timeA;
    });

    if (!q) return sorted;
    const s = q.toLowerCase();
    return sorted.filter((x) => x.name.toLowerCase().includes(s));
  }, [conversations, tab, q, me?.userId, me?.role]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate("ChatDetail", {
        conversationId: item.id,
        title: item.name,
        avatar: item.avatar,
        propertyMini: null,
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
        {/* preview last message */}
        <Text style={{ color: MUTED, marginTop: 4 }} numberOfLines={1}>
          {item.last || "Bắt đầu trò chuyện…"}
        </Text>
      </View>

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
      <View style={{ paddingTop: 30, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F2F2F2" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", flex: 1 }}>Tin nhắn</Text>
          <Ionicons name="search" size={20} color="#111" />
        </View>
        <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
          <TabPill label="Tất cả" active={tab === "all"} onPress={() => setTab("all")} />
          <TabPill label="Khách thuê" active={tab === "tenant"} onPress={() => setTab("tenant")} />
        </View>
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
            .then((list) => list.forEach(c => dispatch(fetchUnreadCount(c.conversationId))))
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
