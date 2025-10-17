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

  useEffect(() => {
    dispatch(fetchTenantInvoices());
  }, [dispatch]);

  const translateStatus = (status) => {
    switch (status) {
      case "DRAFT":
        return { label: "Bản nháp", color: "#999" };
      case "ISSUED":
        return { label: "Chờ thanh toán", color: "#f39c12" };
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

  const renderItem = ({ item }) => {
    const { label, color } = translateStatus(item.status);

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
          <Text style={styles.invoiceNo}>
            Mã hóa đơn: {item.invoiceNo || "—"}
          </Text>
          <Text style={styles.property}>
            {item.propertyTitle || "Không có tiêu đề"}
          </Text>
          <Text style={styles.date}>
            Ngày phát hành:{" "}
            {item.issuedAt
              ? new Date(item.issuedAt).toLocaleDateString("vi-VN")
              : "—"}
          </Text>
          <Text style={styles.total}>
            Tổng tiền:{" "}
            {item.total
              ? `${Number(item.total).toLocaleString("vi-VN")} đ`
              : "—"}
          </Text>
          <Text style={[styles.status, { color }]}>
            Trạng thái: {label}
          </Text>
        </View>
        <Icon name="chevron-right" size={22} color="#999" />
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

  if (!items || items.length === 0) {
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
        data={items}
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
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  invoiceNo: { fontWeight: "600", fontSize: 15, marginBottom: 4 },
  property: { color: "#333", marginBottom: 2 },
  date: { color: "#777", fontSize: 12 },
  total: { color: "#f36031", marginTop: 4, fontWeight: "600" },
  status: { marginTop: 2, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
