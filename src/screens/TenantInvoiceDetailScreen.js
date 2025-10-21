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
import { fetchTenantInvoiceDetail } from "../features/invoices/invoiceThunks";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const formatCurrency = (value) => {
  if (value == null) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
};

const TenantInvoiceDetailScreen = ({ route }) => {
  const { invoiceId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { tenantInvoiceDetail: invoice, loading, error } = useSelector(
    (state) => state.invoices
  );

  useEffect(() => {
    dispatch(fetchTenantInvoiceDetail(invoiceId));
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

  const translateStatus = (status) => {
    switch (status) {
      case "PAID":
        return { label: "Đã thanh toán", color: "#16a34a" };
      case "REFUND_PENDING":
        return { label: "Chờ hoàn tiền", color: "#f97316" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", color: "#0ea5e9" };
      default:
        return { label: "Không xác định", color: "#555" };
    }
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

  const { label: statusLabel, color: statusColor } = translateStatus(invoice.status);

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
              <View style={[styles.statusPill, { borderColor: statusColor }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ngày phát hành:</Text>
              <Text style={styles.value}>{formatDate(invoice.issuedAt)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Hạn thanh toán:</Text>
              <Text style={styles.value}>{formatDate(invoice.dueAt)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Tổng tiền:</Text>
              <Text style={styles.value}>{formatCurrency(invoice.total)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Số tiền cần thanh toán:</Text>
              <Text style={styles.value}>{formatCurrency(invoice.dueAmount)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ngày thanh toán:</Text>
              <Text style={styles.value}>{formatDateTime(invoice.paidAt)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Phương thức thanh toán:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentMethod)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Mã giao dịch:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentRef)}</Text>
            </View>
          </View>

          {(invoice.status === "REFUND_PENDING" || invoice.status === "REFUNDED") && (
            <View style={[styles.card, styles.refundCard]}>
              <Text style={styles.sectionTitle}>Thông tin hoàn tiền</Text>

              <Text style={styles.refundMessage}>
                {invoice.status === "REFUND_PENDING"
                  ? "Yêu cầu hoàn tiền đang được xử lý trong vòng 24 giờ."
                  : "Yêu cầu hoàn tiền đã hoàn tất. Cảm ơn bạn đã kiên nhẫn."}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Phí hủy:</Text>
                <Text style={styles.value}>{formatCurrency(invoice.cancellationFee)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Số tiền hoàn lại:</Text>
                <Text style={[styles.value, styles.refundAmount]}>
                  {formatCurrency(invoice.refundableAmount)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Trạng thái xác nhận:</Text>
                <Text style={styles.value}>
                  {invoice.refundConfirmed ? "Đã xác nhận" : "Đang xử lý"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Thời gian yêu cầu:</Text>
                <Text style={styles.value}>{formatDateTime(invoice.refundRequestedAt)}</Text>
              </View>

              {invoice.status === "REFUNDED" && (
                <View style={styles.row}>
                  <Text style={styles.label}>Thời gian hoàn tiền:</Text>
                  <Text style={styles.value}>{formatDateTime(invoice.refundConfirmedAt)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Thông tin khách thuê */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin khách thuê</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Tên:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantName)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantEmail)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{toSafeString(invoice.tenantPhone)}</Text>
            </View>
          </View>

          {/* Thông tin chủ nhà */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin chủ nhà</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Tên:</Text>
              <Text style={styles.value}>{toSafeString(invoice.landlordName)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{toSafeString(invoice.landlordEmail)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{toSafeString(invoice.landlordPhone)}</Text>
            </View>
          </View>

          {/* Thông tin phòng */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Tên phòng:</Text>
              <Text style={styles.value}>{toSafeString(invoice.propertyTitle)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Địa chỉ:</Text>
              <Text style={styles.value}>{toSafeString(invoice.propertyAddressText)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TenantInvoiceDetailScreen;

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
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
  label: { fontSize: 14, fontWeight: "500", color: "#666" },
  value: {
    fontSize: 14,
    fontWeight: "500",
     color: "#1f2937",
    textAlign: "right",
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f8fafc",
  },
  statusPillText: { fontSize: 13, fontWeight: "600" },
  refundCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
  },
  refundMessage: {
    color: "#c2410c",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  refundAmount: {
    color: "#0ea5e9",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
