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
      case "DRAFT":
        return { label: "Bản nháp", color: "#999" };
      case "ISSUED":
        return { label: "Đã phát hành", color: "#f39c12" };
      case "PAID":
        return { label: "Đã thanh toán", color: "green" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", color: "#3498db" };
      case "VOID":
        return { label: "Đã hủy", color: "red" };
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
              <Text style={[styles.value, { color: statusColor, fontWeight: "600" }]}>
                {statusLabel}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ngày phát hành:</Text>
              <Text style={styles.value}>
                {invoice.issuedAt
                  ? new Date(invoice.issuedAt).toLocaleDateString("vi-VN")
                  : "—"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Hạn thanh toán:</Text>
              <Text style={styles.value}>
                {invoice.dueAt
                  ? new Date(invoice.dueAt).toLocaleDateString("vi-VN")
                  : "—"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Tổng tiền:</Text>
              <Text style={styles.value}>
                {invoice.total
                  ? `${Number(invoice.total).toLocaleString("vi-VN")} đ`
                  : "—"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Số tiền cần thanh toán:</Text>
              <Text style={styles.value}>
                {invoice.dueAmount
                  ? `${Number(invoice.dueAmount).toLocaleString("vi-VN")} đ`
                  : "—"}
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
              <Text style={styles.label}>Phương thức thanh toán:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentMethod)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Mã giao dịch:</Text>
              <Text style={styles.value}>{toSafeString(invoice.paymentRef)}</Text>
            </View>
          </View>

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
  label: { fontSize: 14, fontWeight: "500", color: "#666" },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
    flex: 1,
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
