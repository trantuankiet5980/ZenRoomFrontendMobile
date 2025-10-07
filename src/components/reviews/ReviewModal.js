import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STAR_COLOR_ACTIVE = "#f59e0b";
const STAR_COLOR_INACTIVE = "#d1d5db";

export default function ReviewModal({
  visible,
  title = "Đánh giá trải nghiệm",
  subtitle,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  submitting = false,
  errorMessage = "",
  onCancel,
  onSubmit,
  submitLabel = "Đánh giá",
}) {
  const stars = [1, 2, 3, 4, 5];
  const isSubmitDisabled = submitting || !rating;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                width: "100%",
                borderRadius: 16,
                backgroundColor: "#fff",
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {stars.map((value) => {
                  const active = rating >= value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={{ marginHorizontal: 4 }}
                      onPress={() => onRatingChange?.(value)}
                      disabled={submitting}
                    >
                      <Ionicons
                        name={active ? "star" : "star-outline"}
                        size={32}
                        color={active ? STAR_COLOR_ACTIVE : STAR_COLOR_INACTIVE}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={comment}
                onChangeText={onCommentChange}
                placeholder="Chia sẻ thêm cảm nhận của bạn (không bắt buộc)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                style={{
                  minHeight: 90,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  textAlignVertical: "top",
                  color: "#111827",
                  fontSize: 14,
                }}
                editable={!submitting}
              />
              {errorMessage ? (
                <Text
                  style={{
                    marginTop: 8,
                    color: "#dc2626",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {errorMessage}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 18,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f3f4f6",
                    marginRight: 12,
                  }}
                  onPress={onCancel}
                  disabled={submitting}
                >
                  <Text
                    style={{
                      color: "#374151",
                      fontWeight: "600",
                    }}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSubmitDisabled ? "#fcd34d" : "#f97316",
                  }}
                  onPress={onSubmit}
                  disabled={isSubmitDisabled}
                >
                  <Text
                    style={{
                      color: isSubmitDisabled ? "#78350f" : "#fff",
                      fontWeight: "700",
                    }}
                  >
                    {submitting ? "Đang gửi..." : submitLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}