import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
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
  const { title = "Chat", avatar, conversationId: chatIdParam, peerId, propertyId } = route.params || {};

  const listRef = useRef();
  const me = useSelector((s) => s.auth.user);
  const [conversationId, setConversationId] = useState(chatIdParam);
  const bucket = useSelector((s) => conversationId ? (s.chat.messagesByConv[conversationId] || { items: [] }) : { items: [] });

  const [text, setText] = useState("");

  useEffect(() => {
    if (!conversationId) return;
    dispatch(setActiveConversation(conversationId));
    dispatch(clearUnread(conversationId));
    dispatch(fetchMessages({ conversationId, page: 0, size: 50 }));
    dispatch(markReadAll(conversationId));
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const doSubscribe = () => {
      const client = getClient();
      if (!client?.connected) return;
      const sub = client.subscribe(`/topic/chat.${conversationId}`, (msg) => {
        try {
          const dto = JSON.parse(msg.body);
          if (dto?.sender?.userId && dto.sender.userId !== me.userId) {
            dispatch(markReadAll(conversationId));
          }
          dispatch(pushServerMessage(dto));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 20);
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
        peerId,     
        propertyId,
        content
      })).unwrap();

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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 30, borderBottomWidth: 1, borderColor: "#F5F5F5" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{title}</Text>
        <View style={{ flex: 1 }} />
      </View>

      <FlatList
        ref={listRef}
        data={bucket.items}
        keyExtractor={(it) => it.messageId || it.tempId}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

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
