import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import useHideTabBar from "../hooks/useHideTabBar";
import { useSelector, useDispatch } from "react-redux";
import { fetchMessages, sendMessage, markReadAll } from "../features/chat/chatThunks";
import { setActiveConversation, clearUnread, pushLocalMessage, pushServerMessage } from "../features/chat/chatSlice";
import { getClient, ensureConnected, isConnected } from "../sockets/socket";
import S3Image from "../components/S3Image"; 
import { recordUserEvent } from "../features/events/eventsThunks";

const ORANGE = "#f36031", BORDER = "#E5E7EB", MUTED = "#9CA3AF";

export default function ChatDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const {
    title = "Chat",
    avatar,
    conversationId: chatIdParam,
    peerId,
    propertyId,
    propertyMini: propMiniFromRoute,
    initialMessage
  } = route.params || {};

  const listRef = useRef();
  const me = useSelector((s) => s.auth.user);

  // giữ conversationId đồng bộ theo route param (không dùng "|| conversationId" gây lặp).
  const [conversationId, setConversationId] = useState(chatIdParam || null);
  useEffect(() => {
    if (chatIdParam && chatIdParam !== conversationId) setConversationId(chatIdParam);
  }, [chatIdParam]); // eslint-disable-line

  // lấy bucket thô từ redux
  const rawBucket = useSelector((s) =>
    conversationId ? (s.chat.messagesByConv[conversationId] || { items: [] }) : { items: [] }
  );

  // KHỬ TRÙNG tin nhắn: ưu tiên serverMessage (có messageId) đè tempId nếu trùng nội dung-thời điểm
  const bucketItems = useMemo(() => {
    const arr = rawBucket.items || [];
    const map = new Map();
    for (const m of arr) {
      const key = m.messageId || m.tempId || `${m.content}-${m.createdAt}`;
      // nếu đã có temp và giờ có serverMessage (có messageId) → thay bằng m hiện tại
      const existed = map.get(key);
      if (!existed) map.set(key, m);
      else {
        // ưu tiên bản có messageId (server)
        if (!existed.messageId && m.messageId) map.set(key, m);
      }
    }
    // sort theo createdAt tăng dần
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [rawBucket.items]);

  const normalizePropertyMini = useCallback((raw) => {
    if (!raw) return null;
    const addressObj = raw.address || {};
    const address =
      typeof raw.address === "string"
        ? raw.address
        : addressObj.addressFull || raw.addressFull || raw.address || "";

    const thumbnail =
      raw.thumbnailUrl ||
      raw.thumbnail ||
      (Array.isArray(raw.media) && raw.media.length > 0 ? raw.media[0]?.url : null) ||
      raw.imageUrl ||
      null;

    return {
      propertyId: raw.propertyId,
      title: raw.title || raw.propertyName || "Phòng",
      address,
      price: raw.price,
      propertyType: raw.propertyType,
      thumbnailUrl: thumbnail,
      updatedAt: raw.updatedAt,
    };
  }, []);

  const propertyHeaderItems = useMemo(() => {
    const list = [];
    const seen = new Set();

    const pushMini = (mini) => {
      if (!mini?.propertyId || seen.has(mini.propertyId)) return;
      seen.add(mini.propertyId);
      list.push(mini);
    };

    bucketItems.forEach((msg) => {
      const mini = normalizePropertyMini(msg?.property);
      if (mini) pushMini(mini);
    });

  const initMini = normalizePropertyMini(initialMessage?.property || initialMessage?.conversation?.property);
    if (initMini) pushMini(initMini);

    if (!list.length) {
      const fallbackMini = normalizePropertyMini(propMiniFromRoute);
      if (fallbackMini) pushMini(fallbackMini);
    }

    return list;
  }, [bucketItems, normalizePropertyMini, propMiniFromRoute, initialMessage]);

  // Mỗi lần đổi conversationId → luôn fetch + mark read (bỏ điều kiện initialMessage && empty)
  useEffect(() => {
    if (!conversationId) return;
    dispatch(setActiveConversation(conversationId));
    dispatch(clearUnread(conversationId));
    dispatch(fetchMessages({ conversationId, page: 0, size: 50 }));
    dispatch(markReadAll(conversationId));
  }, [conversationId, dispatch]);

  // Subscribe realtime theo conversationId
  useEffect(() => {
    if (!conversationId) return;

    const doSubscribe = () => {
      const client = getClient();
      if (!client?.connected) return;
      const sub = client.subscribe(`/topic/chat.${conversationId}`, (msg) => {
        try {
          const dto = JSON.parse(msg.body);
          // nếu tin của đối phương → mark read
          if (dto?.sender?.userId && dto.sender.userId !== me.userId) {
            dispatch(markReadAll(conversationId));
          }
          dispatch(pushServerMessage(dto));
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

  const [text, setText] = useState("");

  const handlePressProperty = useCallback(
    (pm) => {
      if (!pm?.propertyId) return;

      const metadata = {
        source: "chat_detail",
        ...buildPropertyMetadata(pm),
      };

      dispatch(
        recordUserEvent({
          eventType: "VIEW",
          roomId: pm.propertyId,
          metadata,
        })
      );

      navigation.navigate("PropertyDetail", {
        propertyId: pm.propertyId,
        loggedViewEvent: true,
      });
    },
    [dispatch, navigation]
  );

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

const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

const formatPriceWithUnit = (pm) => {
  if (!pm?.price) return "Giá liên hệ";
  const formatted = Number(pm.price).toLocaleString("vi-VN");
  const type = pm.propertyType || "ROOM";
  return type === "ROOM" ? `${formatted} đ/tháng` : `${formatted} đ/ngày`;
};

const buildPropertyMetadata = (pm = {}) => {
  const metadata = {};
  if (pm.propertyId) metadata.propertyId = pm.propertyId;
  if (pm.title) metadata.title = pm.title;
  if (pm.price) metadata.price = pm.price;
  if (pm.propertyType) metadata.propertyType = pm.propertyType;
  return metadata;
};

const HeaderPropertyList = ({ items, onPressProperty }) => {
  if (!items?.length) return null;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 12 }}>
      {items.map((pm) => {
        const imageUrl = pm.thumbnailUrl || "https://picsum.photos/seed/building/600/400";

        return (
          <TouchableOpacity
            key={pm.propertyId}
            onPress={() => onPressProperty?.(pm)}
            style={{
              borderWidth: 1,
              borderColor: "#F2F2F2",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#fff",
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <S3Image
              src={imageUrl}
              cacheKey={pm.updatedAt}
              style={{ width: 64, height: 64, borderRadius: 8 }}
              alt={pm.title}
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontWeight: "700" }}>
                {pm.title || "Phòng"}
              </Text>
              {!!pm.address && (
                <Text numberOfLines={1} style={{ color: MUTED, marginTop: 2 }}>
                  {formatAddress(pm.address)}
                </Text>
              )}
              {!!pm.price && (
                <Text style={{ marginTop: 4, color: ORANGE, fontWeight: "700" }}>
                  {formatPriceWithUnit(pm)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
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
        data={bucketItems}
        ListHeaderComponent={
          <HeaderPropertyList items={propertyHeaderItems} onPressProperty={handlePressProperty} />
        }
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
