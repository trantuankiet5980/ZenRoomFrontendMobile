import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { axiosInstance } from "../api/axiosInstance";
import useHideTabBar from "../hooks/useHideTabBar";
import { showToast } from "../utils/AppUtils";

const INITIAL_ASSISTANT_MESSAGE = {
  id: "assistant-initial",
  role: "assistant",
  content:
    "Chào bạn! Tôi là Zen AI, trợ lý giúp bạn tìm phòng phù hợp với nhu cầu. Bạn chỉ cần mô tả mong muốn của mình, tôi sẽ gợi ý ngay nhé!",
};

const CHAT_LIMIT = 5;

const EMPTY_FILTERS_MESSAGE =
  "Xin lỗi, Zen AI hiện chỉ hỗ trợ tìm kiếm phòng. Bạn hãy mô tả nhu cầu tìm phòng cụ thể hơn nhé!";

const createMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content: typeof content === "string" ? content : String(content ?? ""),
  ...extras,
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Giá thỏa thuận";
  }
  try {
    const formatted = new Intl.NumberFormat("vi-VN").format(Number(value));
    return `${formatted} đ/đêm`;
  } catch (error) {
    return `${value} đ/đêm`;
  }
};

export default function AiChatScreen() {
  useHideTabBar();
  const navigation = useNavigation();

  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const flatListRef = useRef(null);
  const pendingReplyIdRef = useRef(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd?.({ animated: true });
  }, [messages]);

  const handleOpenProperty = useCallback(
    (propertyId) => {
      if (!propertyId) return;
      navigation.navigate("PropertyDetail", { propertyId });
    },
    [navigation]
  );

  const handleSubmit = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || submitting) return;

    const userMessage = createMessage("user", text);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSubmitting(true);

    const pendingMessage = createMessage(
      "assistant",
      "Vui lòng chờ trong giây lát, tôi đang tìm kết quả phù hợp cho bạn...",
      { pending: true }
    );
    pendingReplyIdRef.current = pendingMessage.id;
    setMessages((prev) => [...prev, pendingMessage]);

    try {
      const payload = {
        message: text,
        limit: CHAT_LIMIT,
      };

      if (conversationHistory.length > 0) {
        payload.history = conversationHistory;
      }

      const { data } = await axiosInstance.post("/ai/chat", payload);

      const replyContent = data?.reply || "";
      const updatedResults = Array.isArray(data?.results) ? data.results : [];
      const updatedFilters = data?.filters || null;
      const hasFilters =
        updatedFilters && typeof updatedFilters === "object" && Object.keys(updatedFilters).length > 0;

      const finalContent = hasFilters ? replyContent : EMPTY_FILTERS_MESSAGE;
      const finalResults = hasFilters ? updatedResults : [];
      const finalFilters = hasFilters ? updatedFilters : null;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingReplyIdRef.current
            ? {
                ...message,
                content: finalContent,
                results: finalResults,
                filters: finalFilters,
                pending: false,
              }
            : message
        )
      );
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: finalContent },
      ]);
    } catch (error) {
      console.warn("AI chat failed", error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingReplyIdRef.current
            ? {
                ...message,
                content:
                  "Xin lỗi, hiện tại tôi chưa thể trả lời bạn. Bạn thử lại sau nhé.",
                error: true,
                pending: false,
              }
            : message
        )
      );
      const message = error?.response?.data?.message || "Không thể gửi yêu cầu";
      showToast("error", "top", "Trợ lý ảo", message);
    } finally {
      setSubmitting(false);
      pendingReplyIdRef.current = null;
    }
  }, [conversationHistory, inputValue, submitting]);

  const renderResultCard = useCallback(
    (property, index) => {
      const {
        propertyId,
        title,
        propertyName,
        price,
        address,
        district,
        province,
        thumbnailUrl,
        imageUrl,
      } = property || {};

      const locationText = address || [district, province].filter(Boolean).join(", ");
      const subtitle = propertyName || property?.apartmentCategory || property?.propertyType || "";
      const imageSource = thumbnailUrl || imageUrl || property?.image || "https://picsum.photos/200/120";

      return (
        <TouchableOpacity
          key={propertyId || `${title || "property"}-${index}`}
          style={styles.resultCard}
          onPress={() => handleOpenProperty(propertyId)}
          activeOpacity={0.85}
        >
          <Image source={{ uri: imageSource }} style={styles.resultImage} resizeMode="cover" />
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {title || "Bất động sản"}
            </Text>
            {subtitle ? (
              <Text style={styles.resultSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <Text style={styles.resultPrice}>{formatCurrency(price)}</Text>
            {locationText ? (
              <Text style={styles.resultAddress} numberOfLines={2}>
                {locationText}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [handleOpenProperty]
  );

  const renderMessage = useCallback(
    ({ item }) => {
      const isUser = item.role === "user";
      return (
        <View style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}>
          {!isUser ? (
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Image source={require("../../assets/images/zenroom.png")} style={{ width: 45, height: 45, resizeMode: "contain" }} />
              </View>
            </View>
          ) : null}
          <View style={[styles.messageBlock, isUser ? styles.blockAlignEnd : styles.blockAlignStart]}>
            {!isUser ? (
              <View style={styles.assistantMeta}>
                
              </View>
            ) : null}
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
                item.error ? styles.errorBubble : null,
              ]}
            >
              <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                {item.content}
              </Text>
            </View>
            {!isUser && !item.pending && Array.isArray(item.results) && item.results.length > 0 ? (
              <View style={styles.resultsWrapper}>
                {item.results.map((result, index) => renderResultCard(result, index))}
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [renderResultCard]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.composerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mô tả nhu cầu của bạn..."
            value={inputValue}
            onChangeText={setInputValue}
            editable={!submitting}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, submitting ? styles.sendButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    alignItems: "flex-end",
  },
  alignStart: {
    justifyContent: "flex-start",
  },
  alignEnd: {
    justifyContent: "flex-end",
  },
  messageBlock: {
    maxWidth: "85%",
    gap: 12,
  },
  blockAlignStart: {
    alignItems: "flex-start",
  },
  blockAlignEnd: {
    alignItems: "flex-end",
  },
  assistantMeta: {
    alignSelf: "flex-start",
    marginBottom: 4,
    gap: 2,
  },
  assistantName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  assistantSubtitle: {
    fontSize: 11,
    color: "#6b7280",
  },
  messageBubble: {
    maxWidth: "100%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#f36031",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  assistantText: {
    color: "#111827",
  },
  resultsWrapper: {
    gap: 12,
    alignSelf: "stretch",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 12,
    width: "100%",
  },
  resultImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  resultSubtitle: {
    marginTop: 2,
    color: "#6b7280",
    fontSize: 13,
  },
  resultPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#f36031",
  },
  resultAddress: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
  },
  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    fontSize: 15,
    color: "#111827",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f36031",
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  avatarWrapper: {
    paddingBottom: 4,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
});