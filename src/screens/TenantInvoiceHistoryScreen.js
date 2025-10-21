import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch, useSelector } from "react-redux";
import { fetchTenantInvoices } from "../features/invoices/invoiceThunks";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const TenantInvoiceHistoryScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { items = [], loading, error } = useSelector((state) => state.invoices);
  const allowedStatuses = new Set(["PAID", "REFUND_PENDING", "REFUNDED"]);
  const invoices = items.filter((invoice) => allowedStatuses.has(invoice?.status));

  useEffect(() => {
    dispatch(fetchTenantInvoices());
  }, [dispatch]);

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

  const renderItem = ({ item }) => {
    const { label, color } = translateStatus(item.status);
    const totalLabel =
      item.total != null ? `${Number(item.total).toLocaleString("vi-VN")} đ` : "—";
    const refundableLabel =
      item.refundableAmount != null
        ? `${Number(item.refundableAmount).toLocaleString("vi-VN")} đ`
        : null;
    const issuedDate = item.issuedAt
      ? new Date(item.issuedAt).toLocaleDateString("vi-VN")
      : "—";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("TenantInvoiceDetail", {
            invoiceId: item.invoiceId,
          })
        }
      >
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invoiceNo} numberOfLines={1}>
                {item.invoiceNo || "Mã hóa đơn"}
              </Text>
              <Text style={styles.property} numberOfLines={2}>
                {item.propertyTitle || "Không có tiêu đề"}
              </Text>
            </View>
            <View style={[styles.statusPill, { borderColor: color }]}>
              <Text style={[styles.statusPillText, { color }]}>{label}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Icon name="calendar" size={16} color="#9ca3af" style={{ marginRight: 6 }} />
            <Text style={styles.date}>Ngày phát hành: {issuedDate}</Text>
          </View>

          <View style={styles.row}>
            <Icon name="cash" size={16} color="#f97316" style={{ marginRight: 6 }} />
            <Text style={styles.total}>Tổng tiền: {totalLabel}</Text>
          </View>

          {refundableLabel && (
            <View style={styles.row}>
              <Icon
                name="cash-refund"
                size={16}
                color="#0ea5e9"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.refundable}>Hoàn lại: {refundableLabel}</Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={22} color="#c4c4c4" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f36031" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Lỗi khi tải dữ liệu: {error}</Text>
      </View>
    );
  }

  const Header = () => (
    <View style={styles.safeHeader}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
        <View style={{ width: 32 }} />
      </View>
    </View>
  );

  if (!invoices || invoices.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text>Chưa có hóa đơn nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.invoiceId?.toString()}
        contentContainerStyle={{ padding: 12 }}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default TenantInvoiceHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeHeader: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  invoiceNo: { fontWeight: "700", fontSize: 16, color: "#111827" },
  property: { color: "#4b5563", marginTop: 2, fontSize: 13 },
  date: { color: "#6b7280", fontSize: 12 },
  total: { color: "#f97316", fontWeight: "700", fontSize: 13 },
  refundable: { color: "#0ea5e9", fontWeight: "600", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
    backgroundColor: "#f8fafc",
  },
  statusPillText: { fontWeight: "600", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
