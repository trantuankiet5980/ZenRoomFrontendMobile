import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import useHideTabBar from "../hooks/useHideTabBar";
import { useSelector, useDispatch } from "react-redux";
import { fetchMessages, sendMessage, sendImages, markReadAll } from "../features/chat/chatThunks";
import { setActiveConversation, clearUnread, pushLocalMessage, pushServerMessage } from "../features/chat/chatSlice";
import { getClient, ensureConnected, isConnected } from "../sockets/socket";
import S3Image from "../components/S3Image";
import { recordUserEvent } from "../features/events/eventsThunks";
import * as ImagePicker from "expo-image-picker";
import { showToast } from "../utils/AppUtils";
import { formatRelativeTime } from "../utils/time";

const ORANGE = "#f36031", BORDER = "#E5E7EB", MUTED = "#9CA3AF";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedImage = Animated.createAnimatedComponent(Image);

const clampIndex = (index, length) => {
  if (!length) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
};

const viewerStyles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "#000",
  },
  listContainer: {
    flexGrow: 1,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  pressable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  animatedWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  animatedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: "absolute",
    top: 42,
    right: 20,
    padding: 8,
    zIndex: 2,
  },
  counter: {
    position: "absolute",
    bottom: 44,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  counterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

function AttachmentViewer({ visible, images = [], index = 0, onClose, onIndexChange }) {
  const flatListRef = useRef(null);
  const sanitizedImages = useMemo(
    () => (Array.isArray(images) ? images.filter((img) => !!img?.uri) : []),
    [images]
  );
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(index, sanitizedImages.length));
  const onIndexChangeRef = useRef(onIndexChange);
  const lastReportedIndex = useRef(-1);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  useEffect(() => {
    const safeIndex = clampIndex(index, sanitizedImages.length);
    setCurrentIndex((prev) => (prev === safeIndex ? prev : safeIndex));

    if (visible && sanitizedImages.length) {
      requestAnimationFrame(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: safeIndex, animated: false });
        } catch {}
      });
    }
  }, [index, visible, sanitizedImages.length]);

  useEffect(() => {
    if (lastReportedIndex.current === currentIndex) return;
    lastReportedIndex.current = currentIndex;
    if (typeof onIndexChangeRef.current === "function") {
      onIndexChangeRef.current(currentIndex);
    }
  }, [currentIndex]);

  if (!visible || !sanitizedImages.length) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={viewerStyles.modal}>
        <StatusBar hidden barStyle="light-content" />
        <FlatList
          ref={flatListRef}
          data={sanitizedImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, idx) => `${item.uri || "image"}-${idx}`}
          renderItem={({ item, index: itemIndex }) => (
            <View style={viewerStyles.imageSlide}>
              <ZoomableImage uri={item.uri} active={itemIndex === currentIndex} />
            </View>
          )}
          initialScrollIndex={clampIndex(index, sanitizedImages.length)}
          getItemLayout={(_, idx) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * idx, index: idx })}
          onMomentumScrollEnd={(event) => {
            const offset = event?.nativeEvent?.contentOffset?.x || 0;
            const nextIndex = clampIndex(Math.round(offset / SCREEN_WIDTH), sanitizedImages.length);
            if (nextIndex !== currentIndex) setCurrentIndex(nextIndex);
          }}
          onScrollToIndexFailed={({ index: failedIndex }) => {
            const safeIdx = clampIndex(failedIndex, sanitizedImages.length);
            setTimeout(() => flatListRef.current?.scrollToIndex({ index: safeIdx, animated: false }), 100);
          }}
          contentContainerStyle={viewerStyles.listContainer}
        />
        <TouchableOpacity onPress={onClose} style={viewerStyles.closeButton} activeOpacity={0.8}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={viewerStyles.counter}>
          <Text style={viewerStyles.counterText}>{`${currentIndex + 1}/${sanitizedImages.length}`}</Text>
        </View>
      </View>
    </Modal>
  );
}

function ZoomableImage({ uri, active }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const clampTranslate = useCallback(() => {
    const currentScale = lastScale.current;
    const maxX = Math.max(0, ((SCREEN_WIDTH * currentScale) - SCREEN_WIDTH) / 2);
    const maxY = Math.max(0, ((SCREEN_HEIGHT * currentScale) - SCREEN_HEIGHT) / 2);
    let nextX = lastTranslate.current.x;
    let nextY = lastTranslate.current.y;
    if (nextX > maxX) nextX = maxX;
    if (nextX < -maxX) nextX = -maxX;
    if (nextY > maxY) nextY = maxY;
    if (nextY < -maxY) nextY = -maxY;
    lastTranslate.current = { x: nextX, y: nextY };
    translateX.setValue(nextX);
    translateY.setValue(nextY);
  }, [translateX, translateY]);

  const resetTransform = useCallback(() => {
    lastScale.current = 1;
    lastTranslate.current = { x: 0, y: 0 };
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  }, [scale, translateX, translateY]);

  useEffect(() => {
    resetTransform();
    lastTap.current = 0;
  }, [uri, active, resetTransform]);

  const toggleZoom = useCallback(() => {
    const target = lastScale.current > 1 ? 1 : 2.5;
    Animated.timing(scale, {
      toValue: target,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      lastScale.current = target;
      if (target === 1) {
        resetTransform();
      } else {
        clampTranslate();
      }
    });
  }, [clampTranslate, resetTransform, scale]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => lastScale.current > 1,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          lastScale.current > 1 && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderMove: (_, gestureState) => {
          if (lastScale.current <= 1) return;
          translateX.setValue(lastTranslate.current.x + gestureState.dx);
          translateY.setValue(lastTranslate.current.y + gestureState.dy);
        },
        onPanResponderRelease: () => {
          if (lastScale.current <= 1) return;
          lastTranslate.current = {
            x: translateX.__getValue(),
            y: translateY.__getValue(),
          };
          clampTranslate();
        },
        onPanResponderTerminate: () => {
          if (lastScale.current <= 1) return;
          lastTranslate.current = {
            x: translateX.__getValue(),
            y: translateY.__getValue(),
          };
          clampTranslate();
        },
      }),
    [clampTranslate, translateX, translateY]
  );

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 250) {
      toggleZoom();
    }
    lastTap.current = now;
  }, [toggleZoom]);

  if (!uri) {
    return null;
  }

  return (
    <Pressable style={viewerStyles.pressable} onPress={handlePress} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          viewerStyles.animatedWrapper,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <AnimatedImage source={{ uri }} resizeMode="contain" style={viewerStyles.animatedImage} />
      </Animated.View>
    </Pressable>
  );
}

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
  const myId = me?.userId || null;
  const [text, setText] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [sending, setSending] = useState(false);
  const maxImagesPerMessage = 10;
  const [imageViewer, setImageViewer] = useState({ visible: false, index: 0, images: [] });

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
      const key =
        m.messageId ||
        m.clientRequestId ||
        m.tempId ||
        `${m.sender?.userId || ""}-${m.createdAt}-${m.content || ""}`;
      const existed = map.get(key);
      if (!existed) {
        map.set(key, m);
      } else {
        const preferCurrent = (!!m.messageId && !existed.messageId) || (!!m.attachments?.length && !existed.attachments?.length);
        if (preferCurrent) map.set(key, m);
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
          if (dto?.sender?.userId && myId && dto.sender.userId !== myId) {
            dispatch(markReadAll(conversationId));
          }
          dispatch(pushServerMessage({ ...dto, __currentUserId: myId }));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 16);
        } catch {}
      });
      return () => sub?.unsubscribe();
    };

    let cleanup;
    if (isConnected()) cleanup = doSubscribe();
    else ensureConnected(() => { cleanup = doSubscribe(); }, conversationId);

    return () => { cleanup && cleanup(); };
  }, [conversationId, myId, dispatch]);

  const handlePickImages = useCallback(async () => {
    try {
      const remaining = maxImagesPerMessage - pendingImages.length;
      if (remaining <= 0) {
        showToast("info", "top", "Thông báo", "Bạn chỉ có thể gửi tối đa 10 hình ảnh mỗi lần.");
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "top", "Thiếu quyền", "Vui lòng cấp quyền truy cập thư viện ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled) return;
      const assets = Array.isArray(result.assets) ? result.assets : [];
      const normalized = assets
        .filter((asset) => asset?.uri)
        .slice(0, remaining)
        .map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName || asset.filename || `image-${Date.now()}-${idx}.jpg`,
          type: asset.mimeType || asset.type || "image/jpeg",
        }));

      if (!normalized.length) return;
      setPendingImages((prev) => {
        const merged = [...prev, ...normalized];
        return merged.slice(0, maxImagesPerMessage);
      });
    } catch (err) {
      console.warn("pickImages error", err);
      showToast("error", "top", "Lỗi", "Không thể truy cập thư viện ảnh");
    }
  }, [pendingImages.length, maxImagesPerMessage]);

  const handleRemovePendingImage = useCallback((index) => {
    setPendingImages((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const openImageViewer = useCallback((images, index = 0) => {
    if (!images?.length) return;
    setImageViewer({ visible: true, images, index });
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewer((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleViewerIndexChange = useCallback((idx) => {
    setImageViewer((prev) => (prev.index === idx ? prev : { ...prev, index: idx }));
  }, []);

  const doSend = async () => {
    if (sending) return;
    const content = text.trim();
    const hasImages = pendingImages.length > 0;
    if (!content && !hasImages) return;

    const imagesToSend = pendingImages;
    const tempId = "tmp-" + Date.now();

    if (conversationId) {
      dispatch(
        pushLocalMessage({
          conversationId,
          content,
          fullname: me.fullName || me.name,
          me,
          tempId,
          clientRequestId: tempId,
          localImages: imagesToSend.map((img) => img.uri),
        })
      );
    }

    setText("");
    setPendingImages([]);
    setSending(true);

    try {
      const thunk = hasImages ? sendImages : sendMessage;
      const res = await dispatch(
        thunk({
          conversationId,
          peerId,
          propertyId,
          content: content || undefined,
          images: hasImages ? imagesToSend : undefined,
          clientRequestId: tempId,
        })
      ).unwrap();

      const newCid = res?.serverMessage?.conversation?.conversationId || res?.conversationId;
      if (!conversationId && newCid) setConversationId(newCid);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error("send chat error", e);
      const errorMessage =
        e?.message ||
        e?.error ||
        e?.detail ||
        e?.data?.message ||
        e?.response?.data?.message ||
        "Gửi tin nhắn thất bại";
      showToast("error", "top", "Lỗi", errorMessage);
      setPendingImages(imagesToSend);
    } finally {
      setSending(false);
    }
  };

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
    const mine = !!myId && item.sender?.userId === myId;
    const senderName = item.sender?.fullName || item.fullname || "Ẩn danh";
    const attachments = Array.isArray(item.attachments) ? item.attachments.filter((att) => att && att.url) : [];
    const localImages = Array.isArray(item.localImages) ? item.localImages.filter(Boolean) : [];
    const viewerImages = [
      ...localImages.map((uri) => ({ uri })),
      ...attachments.map((att) => ({ uri: att.url })),
    ];
    const hasImages = attachments.length > 0 || localImages.length > 0;
    const hasContent = !!item.content?.trim();
    const totalImages = attachments.length + localImages.length;
    const bubbleColor = mine ? (hasImages ? "#FCE8DE" : ORANGE) : hasImages ? "#F8FAFC" : "#F2F4F5";
    const textColor = mine && !hasImages ? "#fff" : "#111";
    const imageSize = totalImages > 1 ? 120 : 200;
    const imageStyle = {
      width: imageSize,
      height: imageSize,
      borderRadius: 12,
      backgroundColor: "#fff",
    };
    const timeLabel = formatRelativeTime(item.createdAt);
    const statusText = mine
      ? item.status === "sending" || (!item.messageId && item.status !== "sent" && item.status !== "seen")
        ? "Đang gửi"
        : item.status === "seen" || item.readAt || item.read
          ? "Đã xem"
          : "Đã gửi"
      : "";
    const metaParts = [];
    if (timeLabel) metaParts.push(timeLabel);
    if (statusText) metaParts.push(statusText);
    const metaLabel = metaParts.join(" · ");

    return (
      <View style={{ paddingHorizontal: 16, marginTop: 10, alignItems: mine ? "flex-end" : "flex-start" }}>
        {!mine && <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 2, marginLeft: 4 }}>{senderName}</Text>}
        <View
          style={{
            maxWidth: "80%",
            padding: hasContent ? 10 : hasImages ? 8 : 10,
            borderRadius: 14,
            backgroundColor: bubbleColor,
            gap: hasImages && hasContent ? 8 : 0,
          }}
        >
          {hasImages && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {localImages.map((uri, idx) => (
                <TouchableOpacity
                  key={`local-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => openImageViewer(viewerImages, idx)}
                >
                  <Image source={{ uri }} style={[imageStyle, { opacity: 0.7 }]} resizeMode="cover" />
                </TouchableOpacity>
              ))}
              {attachments.map((att, idx) => (
                <TouchableOpacity
                  key={att.attachmentId || att.url || `att-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => openImageViewer(viewerImages, localImages.length + idx)}
                >
                  <S3Image src={att.url} style={imageStyle} alt={`attachment-${idx + 1}`} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {hasContent && <Text style={{ color: textColor }}>{item.content}</Text>}
        </View>
        {!!metaLabel && (
          <Text style={{ color: MUTED, fontSize: 11, marginTop: 4, textAlign: mine ? "right" : "left" }}>
            {metaLabel}
          </Text>
        )}
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

      <AttachmentViewer
        visible={imageViewer.visible}
        images={imageViewer.images}
        index={imageViewer.index}
        onClose={closeImageViewer}
        onIndexChange={handleViewerIndexChange}
      />

      {pendingImages.length > 0 && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderColor: BORDER,
            backgroundColor: "#fff",
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {pendingImages.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={{ position: "relative" }}>
                <Image source={{ uri: img.uri }} style={{ width: 84, height: 84, borderRadius: 12 }} />
                <TouchableOpacity
                  onPress={() => handleRemovePendingImage(idx)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#f87171" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
            {pendingImages.length}/{maxImagesPerMessage} hình ảnh đã chọn
          </Text>
        </View>
      )}

      {/* Composer */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: BORDER, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={handlePickImages}
          disabled={pendingImages.length >= maxImagesPerMessage}
          style={{ paddingHorizontal: 4, paddingVertical: 4 }}
        >
          <Ionicons
            name="image"
            size={24}
            color={pendingImages.length >= maxImagesPerMessage ? MUTED : ORANGE}
          />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={MUTED}
          multiline
          style={{
            flex: 1,
            backgroundColor: "#F7F7F7",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginHorizontal: 8,
            maxHeight: 120,
          }}
        />
        <TouchableOpacity onPress={doSend} disabled={sending} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="send" size={22} color={sending ? MUTED : ORANGE} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
