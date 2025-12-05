import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import { axiosInstance } from "../api/axiosInstance";
import { showToast } from "../utils/AppUtils";

const COLORS = {
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  orange: "#f97316",
  green: "#16a34a",
  red: "#ef4444",
  card: "#fff",
};

export default function LandlordWalletScreen({ navigation }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wallet", {
        params: {
          month: filters.month,
          year: filters.year,
        },
      });
      setWallet(res.data?.wallet ?? null);
      const sorted = (res.data?.transactions || []).slice().sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
      setTransactions(sorted);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
      showToast("error", "top", "Lỗi", "Không thể tải thông tin ví");
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData().finally(() => setRefreshing(false));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number(value || 0)
    );

  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const transactionLabel = (type) => {
    if (type === "MONEY_IN") return "Giao dịch";
    if (type === "MONEY_OUT") return "Rút tiền";
    return "Giao dịch";
  };

  const filteredTransactions = useMemo(() => transactions, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View
        style={{
          paddingTop: Platform.OS === "android" ? 40 : 0,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderColor: COLORS.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.text }}>Ví của tôi</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            padding: 16,
            backgroundColor: COLORS.card,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>Số dư ví</Text>
            <Ionicons name="wallet-outline" size={22} color={COLORS.orange} />
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.orange} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={{ fontSize: 26, fontWeight: "800", color: COLORS.text }}>
                {formatCurrency(wallet?.balance || 0)}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                Cập nhật lần cuối: {wallet?.updatedAt ? formatDateTime(wallet.updatedAt) : "-"}
              </Text>
            </>
          )}
        </View>

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            padding: 12,
            backgroundColor: COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 15, color: COLORS.text, marginBottom: 10 }}>
            Quản lý dòng tiền
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ActionButton
              icon="cash-outline"
              label="Rút tiền"
              color={COLORS.red}
              onPress={() => showToast("info", "top", "Thông báo", "Tính năng rút tiền đang được phát triển")}
            />
            <ActionButton
              icon="swap-vertical-outline"
              label="Giao dịch"
              color={COLORS.green}
              onPress={() => setShowTransactions((prev) => !prev)}
              active={showTransactions}
            />
          </View>
        </View>

        {showTransactions && (
          <View style={{ marginTop: 12, marginHorizontal: 16 }}>
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: COLORS.text }}>
                  Giao dịch
                </Text>
                <Ionicons name="filter-outline" size={18} color={COLORS.muted} />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowMonthPicker(true)}
                  style={filterButtonStyle}
                >
                  <Text style={filterTextStyle}>
                    {filters.month ? `Tháng ${filters.month}` : "Tháng"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowYearPicker(true)}
                  style={filterButtonStyle}
                >
                  <Text style={filterTextStyle}>{filters.year || "Năm"}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12, gap: 10 }}>
                {loading ? (
                  <ActivityIndicator color={COLORS.orange} style={{ marginVertical: 16 }} />
                ) : filteredTransactions.length === 0 ? (
                  <Text style={{ textAlign: "center", color: COLORS.muted, marginTop: 12 }}>
                    Chưa có giao dịch
                  </Text>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIn = tx.type === "MONEY_IN";
                    const amountPrefix = isIn ? "+" : "-";
                    const amountColor = isIn ? COLORS.green : COLORS.red;
                    return (
                      <View
                        key={tx.transactionId}
                        style={{
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: 10,
                          padding: 12,
                          gap: 6,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontWeight: "700", color: COLORS.text }}>
                            {transactionLabel(tx.type)}
                          </Text>
                          <Text style={{ fontWeight: "700", color: amountColor }}>
                            {`${amountPrefix}${formatCurrency(tx.amount)}`}
                          </Text>
                        </View>
                        {tx.description ? (
                          <Text style={{ color: COLORS.text }}>{tx.description}</Text>
                        ) : null}
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                          {formatDateTime(tx.createdAt)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showMonthPicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View style={{ backgroundColor: COLORS.card, borderRadius: 10, margin: 20 }}>
            <Picker
              selectedValue={filters.month}
              onValueChange={(val) => {
                setFilters((prev) => ({ ...prev, month: val }));
                setShowMonthPicker(false);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Picker.Item label={`Tháng ${i + 1}`} value={i + 1} key={i} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      <Modal visible={showYearPicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View style={{ backgroundColor: COLORS.card, borderRadius: 10, margin: 20 }}>
            <Picker
              selectedValue={filters.year}
              onValueChange={(val) => {
                setFilters((prev) => ({ ...prev, year: val }));
                setShowYearPicker(false);
              }}
            >
              {Array.from({ length: 6 }, (_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return <Picker.Item label={`${y}`} value={y} key={y} />;
              })}
            </Picker>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActionButton({ icon, label, color, onPress, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? color : COLORS.border,
        backgroundColor: active ? `${color}15` : "#fff",
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color, fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const filterButtonStyle = {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: COLORS.border,
  alignItems: "center",
  backgroundColor: "#fff",
};

const filterTextStyle = {
  color: COLORS.text,
  fontWeight: "600",
  fontSize: 13,
};