import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

const BACKDROP_COLOR = "rgba(0, 0, 0, 0.4)";
const BORDER_COLOR = "#e5e7eb";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const PRIMARY_COLOR = "#ef4444";

export default function CancelReasonModal({
  visible,
  title = "Yêu cầu hoàn tiền",
  description,
  reason,
  onReasonChange,
  errorMessage,
  submitting,
  onCancel,
  onSubmit,
  confirmLabel = "Xác nhận hủy",
  cancelLabel = "Đóng",
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: BACKDROP_COLOR,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 24,
            borderWidth: 1,
            borderColor: BORDER_COLOR,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: TEXT_COLOR,
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={{
                fontSize: 14,
                color: MUTED_COLOR,
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              {description}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 14,
              color: TEXT_COLOR,
              fontWeight: "600",
              marginBottom: 6,
            }}
          >
            Lý do hủy
          </Text>
          <TextInput
            value={reason}
            onChangeText={onReasonChange}
            placeholder="Nhập lý do hủy"
            placeholderTextColor={MUTED_COLOR}
            style={{
              borderWidth: 1,
              borderColor: errorMessage ? "#dc2626" : BORDER_COLOR,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              minHeight: 90,
              textAlignVertical: "top",
              fontSize: 14,
              color: TEXT_COLOR,
            }}
            multiline
          />
          {errorMessage ? (
            <Text
              style={{
                color: "#dc2626",
                marginTop: 6,
                fontSize: 12,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginRight: 12,
              }}
              onPress={onCancel}
              disabled={submitting}
            >
              <Text style={{ fontSize: 14, color: MUTED_COLOR }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: PRIMARY_COLOR,
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 10,
                opacity: submitting ? 0.7 : 1,
              }}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#fff",
                    fontWeight: "600",
                  }}
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}