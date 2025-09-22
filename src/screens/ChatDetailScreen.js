import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessages,
  markReadAll,
  pushLocalMessage,
  sendMessage,
} from "../features/chat/chatSlice";
import useHideTabBar from "../hooks/useHideTabBar";

const ORANGE = "#f36031", BORDER = "#E5E7EB", MUTED = "#9CA3AF";

export default function ChatDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, title = "Chat" } = route.params || {};

  const dispatch = useDispatch();
  const { userId: meId, fullName: meName } = useSelector(s => s.auth || {});
  const { messagesByConv, sending } = useSelector(s => s.chat);
  const bucket = messagesByConv[conversationId] || { items: [], loading: false, page: 0, hasMore: false };

  const [text, setText] = useState("");
  const listRef = useRef();

  // Load trang đầu
  useEffect(() => {
    if (!conversationId) return;
    dispatch(fetchMessages({ conversationId, page: 0, size: 20 }));
  }, [conversationId, dispatch]);

  // Khi focus: đánh dấu đã đọc tất cả
  useFocusEffect(
    useCallback(() => {
      if (conversationId) dispatch(markReadAll(conversationId));
    }, [conversationId, dispatch])
  );

  // Cuộn cuối khi dữ liệu đổi
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
    return () => clearTimeout(t);
  }, [bucket.items.length]);

  const onSend = () => {
    const content = text.trim();
    if (!content) return;

    // Optimistic: push local
    dispatch(pushLocalMessage({
      conversationId,
      content,
      me: { userId: meId, fullName: meName }
    }));
    setText("");

    // Gửi lên server
    dispatch(sendMessage({ conversationId, content }));
  };

  const getSenderId = (msg) =>
    msg?.sender?.userId || msg?.senderId || msg?.userId || msg?.fromId || null;

  const renderItem = ({ item }) => {
    const senderId = getSenderId(item);
    const mine = (senderId && meId && senderId === meId) || item?.__temp === true;

    return (
      <View style={{ paddingHorizontal:16, marginTop:10, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <View style={{
          maxWidth:'80%', padding:10, borderRadius:14,
          backgroundColor: mine ? ORANGE : '#F2F4F5'
        }}>
          <Text style={{ color: mine ? '#fff' : '#111' }}>{item.content}</Text>
        </View>
        <Text style={{ color:MUTED, fontSize:11, marginTop:4 }}>
          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {item.__temp ? ' · Đang gửi...' : ''}
        </Text>
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
        <Text style={{ fontSize: 18, fontWeight: "700" }} numberOfLines={1}>{title}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }}>
          <Ionicons name="call-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={bucket.items}
        keyExtractor={(it, idx) => String(it.messageId || it.id || it.tempId || idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Composer */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: BORDER }}>
        <TouchableOpacity style={{ paddingHorizontal: 6 }}>
          <Ionicons name="add-circle-outline" size={24} color={ORANGE} />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1, backgroundColor: "#F7F7F7", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8 }}
        />
        <TouchableOpacity onPress={onSend} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="send" size={22} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
