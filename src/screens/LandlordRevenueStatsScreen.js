import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Platform,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { Picker } from "@react-native-picker/picker";
import {
    fetchLandlordMonthlyRevenue,
    fetchLandlordYearlyRevenue,
} from "../features/invoices/invoiceThunks";
import {
    selectLandlordRevenueStats,
    selectInvoiceLoading,
} from "../features/invoices/invoiceSlice";

const ORANGE = "#f97316";
const SUCCESS = "#16a34a";
const TEXT = "#111827";
const MUTED = "#9CA3AF";
const BLUE = "#3b82f6";
const RED = "#ef4444";

const TABS = [
    { key: "monthly", label: "Tháng", icon: "trending-up-outline" },
    { key: "yearly", label: "Năm", icon: "bar-chart-outline" },
];

export default function LandlordRevenueStatsScreen({ navigation }) {
    const dispatch = useDispatch();
    const stats = useSelector(selectLandlordRevenueStats);
    const loading = useSelector(selectInvoiceLoading);

    const [tab, setTab] = useState("monthly");
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    });

    const fetchData = useCallback(() => {
        if (tab === "monthly") {
            return dispatch(fetchLandlordMonthlyRevenue({ year: filters.year, month: filters.month }));
        } else if (tab === "yearly") {
            return dispatch(fetchLandlordYearlyRevenue({ year: filters.year }));
        }
    }, [dispatch, tab, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData().finally(() => setRefreshing(false));
    };

    const currentStats = stats[tab] || {};
    const data = currentStats.breakdown || [];
    const summary = currentStats.summary;

    const formatCurrency = (v) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const formatX = (item) => {
        if (item.date) return item.date.split("-").reverse().join("/");
        if (item.month && item.year) return `Tháng ${item.month}/${item.year}`;
        if (item.year) return `Năm ${item.year}`;
        return "-";
    };

    const totalReceivable = summary?.totalLandlordReceivable ??
        data.reduce((sum, d) => sum + (d.netRevenue || d.landlordReceivable || 0), 0);

    const totalPlatformFee = summary?.totalPlatformFee ?? data.reduce((sum, d) => sum + (d.platformFee || 0), 0);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            {/* Header */}
            <View
                style={{
                    paddingTop: Platform.OS === "android" ? 40 : 0,
                    paddingBottom: 12,
                    paddingHorizontal: 16,
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderColor: "#e5e7eb",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                    <Ionicons name="chevron-back" size={24} color={TEXT} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>
                    Thống kê doanh thu
                </Text>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 50 }}
            >
                {/* Tabs */}
                <View
                    style={{
                        flexDirection: "row",
                        paddingHorizontal: 16,
                        marginTop: 12,
                        gap: 8,
                    }}
                >
                    {TABS.map((t) => (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => setTab(t.key)}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 10,
                                borderRadius: 24,
                                backgroundColor: tab === t.key ? ORANGE : "#fff",
                                borderWidth: 1,
                                borderColor: tab === t.key ? ORANGE : "#e5e7eb",
                                gap: 6,
                            }}
                        >
                            <Ionicons name={t.icon} size={16} color={tab === t.key ? "#fff" : TEXT} />
                            <Text
                                style={{
                                    color: tab === t.key ? "#fff" : TEXT,
                                    fontWeight: "600",
                                    fontSize: 13,
                                }}
                            >
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>


                {/* Bộ lọc */}
                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                    <FilterBar tab={tab} filters={filters} setFilters={setFilters} />
                </View>

                {/* Tổng doanh thu */}
                <View
                    style={{
                        marginHorizontal: 16,
                        marginTop: 16,
                        padding: 16,
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        alignItems: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        elevation: 2,
                    }}
                >
                    <Text style={{ color: MUTED, fontSize: 14 }}>Tổng doanh thu dự kiến</Text>
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "800",
                            color: SUCCESS,
                            marginTop: 4,
                        }}
                    >
                        {formatCurrency(totalReceivable)}
                    </Text>
                    <Text style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>Phí nền tảng</Text>
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: BLUE,
                            marginTop: 2,
                        }}
                    >
                        {formatCurrency(totalPlatformFee)}
                    </Text>
                </View>

                {/* Danh sách thống kê chi tiết */}
                <View style={{ marginTop: 16, marginHorizontal: 16 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 50 }} />
                    ) : data.length === 0 ? (
                        <Text style={{ textAlign: "center", color: MUTED, marginTop: 40 }}>
                            Chưa có dữ liệu
                        </Text>
                    ) : (
                        data.map((item, index) => (
                            <View
                                key={index}
                                style={{
                                    backgroundColor: "#fff",
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                }}
                            >
                                <Text style={{ fontSize: 14, color: TEXT, fontWeight: "600" }}>
                                    {formatX(item)}
                                </Text>
                                {item.paidRevenue !== undefined || item.refundedAmount !== undefined ? (
                                    <>
                                        <Text style={{ fontSize: 13, color: SUCCESS, marginTop: 2 }}>
                                            Tổng tiền: {formatCurrency(item.netRevenue || 0)}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={{ fontSize: 13, color: SUCCESS, marginTop: 4 }}>
                                            Dự kiến nhận: {formatCurrency(item.landlordReceivable || item.netRevenue || 0)}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: BLUE, marginTop: 2 }}>
                                            Phí nền tảng: {formatCurrency(item.platformFee || 0)}
                                        </Text>
                                    </>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

/* ===== Filter Bar ===== */
function FilterBar({ tab, filters, setFilters }) {
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);

    // ==== TAB THÁNG ====
    if (tab === "monthly") {
        return (
            <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Chọn năm */}
                <TouchableOpacity onPress={() => setShowYearPicker(true)} style={filterBtnStyle(true)}>
                    <Text style={filterTextStyle(true)}>
                        {filters.year ? `Năm ${filters.year}` : "Chọn năm"}
                    </Text>
                </TouchableOpacity>

                {/* Chọn tháng */}
                <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={filterBtnStyle(true)}>
                    <Text style={filterTextStyle(true)}>
                        {filters.month ? `Tháng ${filters.month}` : "Chọn tháng"}
                    </Text>
                </TouchableOpacity>

                {/* Modal chọn tháng/năm */}
                <Modal visible={showYearPicker} transparent animationType="slide">
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            backgroundColor: "rgba(0,0,0,0.4)",
                        }}
                    >
                        <View style={{ backgroundColor: "#fff", borderRadius: 10, margin: 20 }}>
                            <Picker
                                selectedValue={filters.year}
                                onValueChange={(val) => {
                                    setFilters((prev) => ({ ...prev, year: val }));
                                    setShowYearPicker(false);
                                }}
                            >
                                {Array.from({ length: 6 }, (_, i) => {
                                    const y = 2022 + i;
                                    return <Picker.Item label={`${y}`} value={y} key={y} />;
                                })}
                            </Picker>
                        </View>
                    </View>
                </Modal>

                <Modal visible={showMonthPicker} transparent animationType="slide">
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            backgroundColor: "rgba(0,0,0,0.4)",
                        }}
                    >
                        <View style={{ backgroundColor: "#fff", borderRadius: 10, margin: 20 }}>
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
            </View>
        );
    }

    // ==== TAB NĂM ====
    return (
        <View>
            <TouchableOpacity onPress={() => setShowYearPicker(true)} style={filterBtnStyle(true)}>
                <Text style={filterTextStyle(true)}>
                    {filters.year ? `Năm ${filters.year}` : "Chọn năm"}
                </Text>
            </TouchableOpacity>

            <Modal visible={showYearPicker} transparent animationType="slide">
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.4)",
                    }}
                >
                    <View style={{ backgroundColor: "#fff", borderRadius: 10, margin: 20 }}>
                        <Picker
                            selectedValue={filters.year}
                            onValueChange={(val) => {
                                setFilters((prev) => ({ ...prev, year: val }));
                                setShowYearPicker(false);
                            }}
                        >
                            {Array.from({ length: 6 }, (_, i) => {
                                const y = 2022 + i;
                                return <Picker.Item label={`${y}`} value={y} key={y} />;
                            })}
                        </Picker>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const filterBtnStyle = (active) => ({
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
});

const filterTextStyle = (active) => ({
    color: active ? TEXT : MUTED,
    fontWeight: active ? "600" : "400",
    fontSize: 13,
});
