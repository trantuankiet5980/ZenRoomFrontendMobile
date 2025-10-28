import React, { useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandlordInvoiceDetail } from "../features/invoices/invoiceThunks";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const LandlordInvoiceDetailScreen = () => {
  const route = useRoute();
  const { invoiceId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { landlordInvoiceDetail: invoice, loading, error } = useSelector(
    (state) => state.invoices
  );

  useEffect(() => {
    dispatch(fetchLandlordInvoiceDetail(invoiceId));
  }, [dispatch, invoiceId]);

  const toSafeString = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[Object]";
      }
    }
    return String(value);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f36031" />
      </View>
    );
  }

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
      <View style={{ width: 32 }} />
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.errorText}>{toSafeString(error)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Không tìm thấy hóa đơn</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Hóa đơn: {toSafeString(invoice.invoiceNo)}</Text>

          {/* Thông tin hóa đơn */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin hóa đơn</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[styles.value, { color: getStatusColor(invoice.status) }]}>
                {formatStatus(invoice.status)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ngày phát hành:</Text>
              <Text style={styles.value}>
                {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString("vi-VN") : "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Hạn thanh toán:</Text>
              <Text style={styles.value}>
                {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("vi-VN") : "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tổng tiền:</Text>
              <Text style={styles.value}>
                {invoice.total ? `${Number(invoice.total).toLocaleString("vi-VN")} đ` : "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cần thanh toán:</Text>
              <Text style={styles.value}>
                {invoice.dueAmount ? `${Number(invoice.dueAmount).toLocaleString("vi-VN")} đ` : "—"}
              </Text>
            </View>
            {invoice.paidAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Ngày thanh toán:</Text>
                <Text style={styles.value}>
                  {new Date(invoice.paidAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Phương thức:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentMethod)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mã giao dịch:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentRef)}</Text>
            </View>
          </View>

          {/* Thông tin khách thuê */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Khách thuê</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Tên:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantName)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantEmail)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>SĐT:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantPhone)}</Text>
            </View>
          </View>

          {/* Thông tin phòng */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Phòng cho thuê</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Tên phòng:</Text>
              <Text style={styles.value}>{toSafeString(invoice.propertyTitle)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Địa chỉ:</Text>
              <Text style={styles.value}>{toSafeString(invoice.propertyAddressText)}</Text>
            </View>
          </View>

          {/* Nút hành động (tùy chọn) 
          {invoice.status === "PAID" && (
            <TouchableOpacity style={styles.refundButton}>
              <Text style={styles.refundButtonText}>Yêu cầu hoàn tiền</Text>
            </TouchableOpacity>
          )}*/}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "PAID": return "#4caf50";
    case "ISSUED": return "#f36031";
    case "REFUNDED": return "#2196f3";
    case "VOID": return "#9e9e9e";
    default: return "#757575";
  }
};

const formatStatus = (status) => {
  switch (status) {
    case "DRAFT": return "Nháp";
    case "ISSUED": return "Đã phát hành";
    case "PAID": return "Đã thanh toán";
    case "REFUNDED": return "Đã hoàn tiền";
    case "VOID": return "Đã hủy";
    case "REFUND_PENDING": return "Đang hoàn tiền";
    default: return status;
  }
};

export default LandlordInvoiceDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f36031",
    paddingVertical: 15,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f36031",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
    flex: 1,
  },
  refundButton: {
    backgroundColor: "#ff9800",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  refundButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  notFoundText: {
    color: "#757575",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});