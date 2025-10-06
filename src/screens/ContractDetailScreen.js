import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";

import { fetchContractById } from "../features/contracts/contractThunks";
import {
  selectContractDetail,
  selectContractsLoading,
} from "../features/contracts/contractSlice";
import { axiosInstance } from "../api/axiosInstance";

const BACKGROUND = "#f9fafb";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const PRIMARY = "#0d9488";

const CONTRACT_STATUS_LABELS = {
  PENDING_REVIEW: "Chờ duyệt",
  ACTIVE: "Có hiệu lực",
  CANCELLED: "Đã hủy",
};

const CONTRACT_STATUS_COLORS = {
  PENDING_REVIEW: "#f59e0b",
  ACTIVE: "#16a34a",
  CANCELLED: "#dc2626",
};

function formatDateVN(dateString) {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  if (value == null) return "";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getContractStatusLabel(status) {
  if (!status) return "";
  return CONTRACT_STATUS_LABELS[status] || status;
}

function getContractStatusColor(status) {
  return CONTRACT_STATUS_COLORS[status] || TEXT;
}

export default function ContractDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { contractId } = route.params || {};
  const dispatch = useDispatch();
  const contract = useSelector(selectContractDetail);
  const loading = useSelector(selectContractsLoading);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (contractId) {
      dispatch(fetchContractById(contractId));
    }
  }, [contractId, dispatch]);

  const handleOpenPdf = async () => {
    if (downloadingPdf) {
      return;
    }
    if (!contractId) {
      Alert.alert("Thông báo", "Không tìm thấy hợp đồng để xuất PDF.");
      return;
    }
    try {
      setDownloadingPdf(true);
      const baseUrl = (axiosInstance.defaults.baseURL || "http://localhost:8080/api/v1").replace(/\/$/, "");
      const pdfUrl = `${baseUrl}/contracts/${contractId}/pdf`;
      const token = await SecureStore.getItemAsync("accessToken");
      const fileName = `contract-${contract?.contractCode || contractId}.pdf`;
      const baseDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!baseDirectory) {
        throw new Error("No writable directory available");
      }
      const normalizedDirectory = baseDirectory.endsWith("/") ? baseDirectory : `${baseDirectory}/`;
      const targetUri = `${normalizedDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, targetUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (downloadResult.status < 200 || downloadResult.status >= 300) {
        throw new Error("Download failed");
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Chia sẻ hợp đồng",
        });
      } else {
        Alert.alert(
          "Thông báo",
          "Thiết bị không hỗ trợ chia sẻ tệp. Hợp đồng đã được tải về thành công.",
        );
      }
    } catch (error) {
      console.error("Download contract pdf error", error);
      const message =
        error?.message === "No writable directory available"
          ? "Thiết bị không hỗ trợ lưu tệp tải xuống."
          : "Không thể tải hợp đồng. Vui lòng thử lại.";
      Alert.alert("Lỗi", message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BACKGROUND, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={{ flex: 1, backgroundColor: BACKGROUND, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED }}>Không tìm thấy thông tin hợp đồng</Text>
      </View>
    );
  }
  const status = contract.status || contract.contractStatus;
  const statusLabel = getContractStatusLabel(status) || "Đang cập nhật";
  const statusColor = getContractStatusColor(status);

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND }}>
      <Header title="Chi tiết hợp đồng" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>Hợp đồng thuê phòng</Text>
              {contract.contractCode ? (
                <Text style={{ color: MUTED, marginTop: 4 }}>Mã hợp đồng: {contract.contractCode}</Text>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: `${statusColor}1A`,
                  }}
                >
                  <Text style={{ color: statusColor, fontWeight: "600" }}>{statusLabel}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleOpenPdf}
              disabled={downloadingPdf}
              style={{
                backgroundColor: PRIMARY,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                opacity: downloadingPdf ? 0.7 : 1,
              }}
            >
              {downloadingPdf ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Xem hợp đồng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
          <InfoRow label="Tòa nhà" value={contract.buildingName} />
          <InfoRow label="Phòng" value={contract.roomNumber} />
          <InfoRow label="Ngày bắt đầu" value={formatDateVN(contract.startDate)} />
          <InfoRow label="Ngày kết thúc" value={formatDateVN(contract.endDate)} />
          <InfoRow label="Ngày tạo" value={formatDateVN(contract.createdAt)} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Bên thuê</Text>
          <InfoRow label="Họ tên" value={contract.tenantName} />
          <InfoRow label="Số điện thoại" value={contract.tenantPhone} />
          <InfoRow label="Email" value={contract.tenantEmail} />
          <InfoRow label="CCCD" value={contract.citizenId} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Bên cho thuê</Text>
          <InfoRow label="Họ tên" value={contract.landlordName} />
          <InfoRow label="Số điện thoại" value={contract.landlordPhone} />
          <InfoRow label="Email" value={contract.landlordEmail} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Chi phí</Text>
          <InfoRow label="Giá thuê" value={formatCurrency(contract.rentPrice)} />
          <InfoRow label="Tiền cọc" value={formatCurrency(contract.deposit)} />
          <InfoRow label="Ghi chú" value={contract.notes} />
        </Card>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }) {
  return (
    <View
      style={{
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderBottomColor: BORDER,
        borderBottomWidth: 1,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="chevron-back" size={20} color={TEXT} />
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: "700", color: TEXT }}>{title}</Text>
    </View>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", marginBottom: 8 }}>
      <Text style={{ color: MUTED, width: 120 }}>{label}</Text>
      <Text style={{ color: TEXT, flex: 1, fontWeight: "500" }}>{value}</Text>
    </View>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 12,
  },
};