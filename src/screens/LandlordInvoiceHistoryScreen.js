import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandlordInvoices } from "../features/invoices/invoiceThunks";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const LandlordInvoiceHistoryScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { landlordInvoices = [], loading, error, pagination } = useSelector(
    (state) => state.invoices
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchLandlordInvoices({ page: 0, size: 10 }));
  }, [dispatch]);

  const loadMore = () => {
    if (!loading && pagination?.page < pagination?.totalPages - 1) {
      dispatch(
        fetchLandlordInvoices({
          page: pagination.page + 1,
          size: 10,
        })
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchLandlordInvoices({ page: 0, size: 10 }));
    setRefreshing(false);
  };

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() =>
        navigation.navigate("LandlordInvoiceDetail", { invoiceId: item.invoiceId })
      }
    >
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {formatStatus(item.status)}
        </Text>
      </View>
      <Text style={styles.tenantName}>Khách: {item.tenantName || "—"}</Text>
      <Text style={styles.propertyTitle}>{item.propertyTitle || "—"}</Text>
      <View style={styles.invoiceFooter}>
        <Text style={styles.total}>
          {item.total ? `${Number(item.total).toLocaleString("vi-VN")} đ` : "—"}
        </Text>
        <Text style={styles.date}>
          {item.issuedAt
            ? new Date(item.issuedAt).toLocaleDateString("vi-VN")
            : "—"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && landlordInvoices.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f36031" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={landlordInvoices}
        keyExtractor={(item) => item.invoiceId}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && landlordInvoices.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có hóa đơn nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// Helper functions
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
    default: return status;
  }
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
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
  list: { padding: 16 },
  invoiceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  invoiceNo: { fontSize: 16, fontWeight: "600", color: "#333" },
  status: { fontSize: 13, fontWeight: "600" },
  tenantName: { fontSize: 14, color: "#555", marginBottom: 4 },
  propertyTitle: { fontSize: 14, color: "#777", marginBottom: 8 },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: { fontSize: 16, fontWeight: "700", color: "#f36031" },
  date: { fontSize: 13, color: "#999" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 16, color: "#999" },
});

export default LandlordInvoiceHistoryScreen;