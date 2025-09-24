import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import useHideTabBar from "../hooks/useHideTabBar";
import { useSelector, useDispatch } from "react-redux";
import { fetchMessages, sendMessage, markReadAll } from "../features/chat/chatThunks";
import { setActiveConversation, clearUnread, pushLocalMessage, pushServerMessage } from "../features/chat/chatSlice";
import { getClient, ensureConnected, isConnected } from "../sockets/socket";

const ORANGE = "#f36031", BORDER = "#E5E7EB", MUTED = "#9CA3AF";

export default function ChatDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { title = "Chat", avatar, conversationId: chatIdParam, peerId, propertyId, propertyMini } = route.params || {};

  const listRef = useRef();
  const me = useSelector((s) => s.auth.user);
  const [conversationId, setConversationId] = useState(chatIdParam);
  const bucket = useSelector((s) =>
    conversationId ? (s.chat.messagesByConv[conversationId] || { items: [] }) : { items: [] }
  );

  const [text, setText] = useState("");

  // Lần đầu/mỗi khi đổi conversationId → load + mark read
  useEffect(() => {
    if (!conversationId) return;
    dispatch(setActiveConversation(conversationId));
    dispatch(clearUnread(conversationId));
    dispatch(fetchMessages({ conversationId, page: 0, size: 50 }));
    dispatch(markReadAll(conversationId));
  }, [conversationId, dispatch]);

  // Subscribe realtime cho 1 conversationId
  useEffect(() => {
    if (!conversationId) return;

    const doSubscribe = () => {
      const client = getClient();
      if (!client?.connected) return;
      const sub = client.subscribe(`/topic/chat.${conversationId}`, (msg) => {
        try {
          const dto = JSON.parse(msg.body);

          // Nếu là tin của đối phương → mark read
          if (dto?.sender?.userId && dto.sender.userId !== me.userId) {
            dispatch(markReadAll(conversationId));
          }

          dispatch(pushServerMessage(dto));
          // Auto scroll xuống cuối
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 16);
        } catch {}
      });
      return () => sub?.unsubscribe();
    };

    let cleanup;
    if (isConnected()) cleanup = doSubscribe();
    else ensureConnected(() => { cleanup = doSubscribe(); }, conversationId);

    return () => { cleanup && cleanup(); };
  }, [conversationId, me?.userId, dispatch]);

  const doSend = async () => {
    const content = text.trim();
    if (!content) return;

    // Nếu đã có conv → push local (optimistic)
    if (conversationId) {
      const tempId = "tmp-" + Date.now();
      dispatch(pushLocalMessage({
        conversationId,
        content,
        fullname: me.fullName || me.name,
        me,
        tempId,
      }));
    }
    setText("");

    try {
      const res = await dispatch(sendMessage({
        conversationId,
        peerId,     // nếu chưa có conv → BE sẽ tự tạo từ peerId/propertyId
        propertyId,
        content
      })).unwrap();

      // BE có thể trả về conv mới
      const newCid = res?.serverMessage?.conversation?.conversationId || res?.conversationId;
      if (!conversationId && newCid) setConversationId(newCid);

      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {}
  };

  const renderItem = ({ item }) => {
    const mine = item.sender?.userId === me.userId;
    const senderName = item.sender?.fullName || item.fullname || "Ẩn danh";
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 10, alignItems: mine ? "flex-end" : "flex-start" }}>
        {!mine && <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 2, marginLeft: 4 }}>{senderName}</Text>}
        <View style={{ maxWidth: "80%", padding: 10, borderRadius: 14, backgroundColor: mine ? ORANGE : "#F2F4F5" }}>
          <Text style={{ color: mine ? "#fff" : "#111" }}>{item.content}</Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 4, textAlign: mine ? "right" : "left" }}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  const convRow = useSelector(s =>
    conversationId ? s.chat.conversations.find(c => c.conversationId === conversationId) : null
  );

  const headerMini = route.params?.propertyMini || convRow?.propertyMini || null;

  // Thẻ thông tin phòng ở đầu khung chat
  const HeaderPropertyCard = () => {
    const pm = headerMini;
    if (!pm) return null;
    return (
      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#F2F2F2" }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          {pm.thumbnail ? (
            <Image source={{ uri: pm.thumbnail }} style={{ width: 64, height: 64, borderRadius: 8 }} />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: "#EEE", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={20} color="#999" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontWeight: "700" }}>{pm.title || "Phòng trọ"}</Text>
            {!!pm.address && <Text numberOfLines={1} style={{ color: MUTED, marginTop: 2 }}>{pm.address}</Text>}
            {!!pm.price && (
              <Text style={{ marginTop: 4, color: ORANGE, fontWeight: "700" }}>
                {Number(pm.price).toLocaleString("vi-VN")} đ/ngày
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 30, borderBottomWidth: 1, borderColor: "#F5F5F5" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{title}</Text>
        <View style={{ flex: 1 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={bucket.items}
        ListHeaderComponent={<HeaderPropertyCard />}
        keyExtractor={(it, idx) => `${it.messageId || it.tempId || "k"}-${it.createdAt || idx}`}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Composer */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: BORDER, marginBottom: 20 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1, backgroundColor: "#F7F7F7", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8 }}
        />
        <TouchableOpacity onPress={doSend} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="send" size={22} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
