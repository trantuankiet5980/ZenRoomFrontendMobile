import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
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
const SUGGESTION_LIMIT = 3;

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
  const route = useRoute();
  const user = useSelector((state) => state.auth?.user);
  const userId = user?.userId;

  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [activeFilters, setActiveFilters] = useState(null);
  const [homeLocationName, setHomeLocationName] = useState(() => {
    const rawLocation = route?.params?.locationName;
    if (typeof rawLocation !== "string") {
      return null;
    }
    const trimmed = rawLocation.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

  const flatListRef = useRef(null);
  const pendingReplyIdRef = useRef(null);
  const lastSuggestionParamsRef = useRef(null);

  const locationParam = route?.params?.locationName;

  useEffect(() => {
    const trimmed =
      typeof locationParam === "string" ? locationParam.trim() : "";
    setHomeLocationName(trimmed.length > 0 ? trimmed : null);
  }, [locationParam]);

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

  const fetchSuggestions = useCallback(
    async (locationName) => {
      if (!userId) return;

      const payload = {
        userId,
        limit: SUGGESTION_LIMIT,
      };

      const trimmedLocation = typeof locationName === "string" ? locationName.trim() : "";
      if (trimmedLocation) {
        payload.district = trimmedLocation;
      }

      const paramsKey = JSON.stringify(payload);
      if (lastSuggestionParamsRef.current === paramsKey && suggestions.length > 0) {
        return;
      }

      lastSuggestionParamsRef.current = paramsKey;
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      try {
        const { data } = await axiosInstance.post("/ai/suggestions", payload);
        const items = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(items);
      } catch (error) {
        console.warn("AI suggestion fetch failed", error);
        setSuggestions([]);
        setSuggestionsError(error?.response?.data?.message || null);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [suggestions.length, userId]
  );

  const handleSubmit = useCallback(
    async (overrideText) => {
      const sourceText = typeof overrideText === "string" ? overrideText : inputValue;
      const text = sourceText.trim();
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
        setActiveFilters(finalFilters);
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
        setActiveFilters(null);
        const message = error?.response?.data?.message || "Không thể gửi yêu cầu";
        showToast("error", "top", "Trợ lý ảo", message);
      } finally {
        setSubmitting(false);
        pendingReplyIdRef.current = null;
      }
    }, [conversationHistory, inputValue, submitting]);

  const handleSuggestionPress = useCallback(
    (text) => {
      if (!text) return;
      handleSubmit(text);
    },
    [handleSubmit]
  );

  const activeFiltersKey = useMemo(() => {
    if (!activeFilters) return "__none";
    const { district = "", province = "", city = "" } = activeFilters;
    return JSON.stringify({ district, province, city });
  }, [activeFilters]);

  useEffect(() => {
    setSuggestions([]);
    setSuggestionsError(null);
    lastSuggestionParamsRef.current = null;
  }, [homeLocationName, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchSuggestions(homeLocationName);
  }, [activeFiltersKey, fetchSuggestions, homeLocationName, userId]);

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

  const suggestionsSection = useMemo(() => {
    const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;
    if (!suggestionsLoading && !hasSuggestions && !suggestionsError) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsHeaderRow}>
          <Text style={styles.suggestionsTitle}>Gợi ý nhanh</Text>
          {suggestionsLoading ? <ActivityIndicator size="small" color="#f36031" /> : null}
        </View>
        {hasSuggestions ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {suggestions.map((item, index) => {
              const key = `${item?.text || "suggestion"}-${index}`;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(item?.text)}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  <Text style={styles.suggestionText}>{item?.text || ""}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
        {suggestionsError ? (
          <Text style={styles.suggestionsError}>{suggestionsError}</Text>
        ) : null}
      </View>
    );
  }, [handleSuggestionPress, submitting, suggestions, suggestionsError, suggestionsLoading]);

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
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.bottomContainer}>
          {suggestionsSection}
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
    paddingBottom: 220,
    gap: 12,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  suggestionsList: {
    flexDirection: "row",
    gap: 12,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    maxWidth: 260,
  },
  suggestionText: {
    fontSize: 14,
    color: "#111827",
  },
  suggestionsError: {
    fontSize: 12,
    color: "#ef4444",
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
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    gap: 12,
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