import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';
import { useSelector, useDispatch } from "react-redux";
import { fetchMessages, sendMessage } from "../features/chat/chatThunks";
import { pushLocalMessage } from "../features/chat/chatSlice";

const ORANGE = '#f36031', BORDER = '#E5E7EB', MUTED = '#9CA3AF';

export default function ChatDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { name = "Chat", chatId } = route.params || {};
  const listRef = useRef();

  const bucket = useSelector(s => s.chat.messagesByConv[chatId]) || { items: [] };
  const me = useSelector(s => s.auth.user); // user hiện tại

  const [text, setText] = useState("");

  useEffect(() => {
    dispatch(fetchMessages({ conversationId: chatId, page: 0, size: 20 }));
  }, [chatId]);

  const send = () => {
    if (!text.trim()) return;
    const tempId = "tmp-" + Date.now();

    // 1. push local ngay lập tức
    dispatch(pushLocalMessage({
      conversationId: chatId,
      content: text.trim(),
      fullname: me.fullName || me.name,
      me,
      tempId,
    }));

    // 2. gọi API
    dispatch(sendMessage({ conversationId: chatId, content: text.trim() }));

    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

 const renderItem = ({ item }) => {
  const mine = item.sender?.userId === me.userId;

  // Lấy fullname từ server (item.sender.fullName) hoặc local (item.fullname)
  const senderName = item.sender?.fullName || item.fullname || "Ẩn danh";

  return (
    <View
      style={{
        paddingHorizontal: 16,
        marginTop: 10,
        alignItems: mine ? "flex-end" : "flex-start",
      }}
    >
      {/* Nếu không phải tin nhắn của mình thì hiển thị tên phía trên bubble */}
      {!mine && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#374151",
            marginBottom: 2,
            marginLeft: 4,
          }}
        >
          {senderName}
        </Text>
      )}

      {/* Bubble */}
      <View
        style={{
          maxWidth: "80%",
          padding: 10,
          borderRadius: 14,
          backgroundColor: mine ? ORANGE : "#F2F4F5",
        }}
      >
        <Text style={{ color: mine ? "#fff" : "#111" }}>{item.content}</Text>
      </View>

      {/* Thời gian */}
      <Text
        style={{
          color: MUTED,
          fontSize: 11,
          marginTop: 4,
          textAlign: mine ? "right" : "left",
        }}
      >
        {new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};




  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30, borderBottomWidth: 1, borderColor: '#F5F5F5' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{name}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }}>
          <Ionicons name="call-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={bucket.items}
        keyExtractor={it => it.messageId || it.tempId}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Composer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: BORDER, marginBottom: 20 }}>
        <TouchableOpacity style={{ paddingHorizontal: 6 }}>
          <Ionicons name="add-circle-outline" size={24} color={ORANGE} />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1, backgroundColor: '#F7F7F7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8 }}
        />
        <TouchableOpacity onPress={send} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="send" size={22} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
