import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Linking,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch, useSelector } from "react-redux";
import { fetchPropertyDetail } from "../features/properties/propertiesThunks";
import { resetProperty } from "../features/properties/propertiesSlice";
import useHideTabBar from '../hooks/useHideTabBar';

const PropertyDetailScreen = ({ route, navigation }) => {
    useHideTabBar();
    const { propertyId } = route.params;
    const [liked, setLiked] = useState(false);
    const dispatch = useDispatch();
    const { current: property, loading, error } = useSelector(
        (state) => state.properties
    );


    useEffect(() => {
        dispatch(fetchPropertyDetail(propertyId));
        return () => {
            dispatch(resetProperty());
        };
    }, [dispatch, propertyId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={{ color: "red" }}>Lỗi: {error}</Text>
            </View>
        );
    }

    if (!property) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy dữ liệu</Text>
            </View>
        );
    }

    const addressFormatted =
        property.address?.addressFull?.replace(/_/g, " ") || "Chưa có địa chỉ";

    const mediaList =
        property.media && property.media.length > 0
            ? property.media
            : [{ url: "https://picsum.photos/600/400" }];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: 40 }]}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="chevron-left" size={28} color="#111" />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    Chi tiết phòng
                </Text>

                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => setLiked((v) => !v)}
                >
                    <Icon
                        name={liked ? "heart" : "heart-outline"}
                        size={24}
                        color="#f36031"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={[styles.container, { paddingTop: 15 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Ảnh */}
                <FlatList
                    horizontal
                    data={mediaList}
                    keyExtractor={(item, index) => item.mediaId || index.toString()}
                    renderItem={({ item }) => (
                        <Image
                            source={{ uri: item.posterUrl || item.url }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />
                    )}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                />

                {/* Tiêu đề + Giá */}
                <View style={{ padding: 12 }}>
                    <Text style={styles.title} numberOfLines={2}>
                        {property.title || "Phòng cho thuê"}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 6,
                        }}
                    >
                        <Icon name="cash" size={20} color="#f36031" />
                        <Text style={styles.price}>
                            {property.price
                                ? `${Number(property.price).toLocaleString(
                                    "vi-VN"
                                )} đ/tháng`
                                : "Thỏa thuận"}
                        </Text>
                    </View>
                    <Text style={styles.subText}>📍 {addressFormatted}</Text>
                </View>
                {/* Thông tin chi tiết */}
                <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <Icon name="stairs" size={24} color="#111" />
                        <Text style={styles.detailLabel}>Tầng</Text>
                        <Text style={styles.detailValue}>{property.floorNo || 0}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="fullscreen" size={24} color="#111" />
                        <Text style={styles.detailLabel}>Diện tích</Text>
                        <Text style={styles.detailValue}>
                            {property.area ? `${property.area} m²` : "N/A"}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="account-group" size={24} color="#111" />
                        <Text style={styles.detailLabel}>Số người</Text>
                        <Text style={styles.detailValue}>
                            {property.capacity || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="cash-multiple" size={24} color="#111" />
                        <Text style={styles.detailLabel}>Đặt cọc</Text>
                        <Text style={styles.detailValue}>
                            {property.deposit
                                ? `${Number(property.deposit).toLocaleString("vi-VN")} đ`
                                : "Thỏa thuận"}
                        </Text>
                    </View>
                </View>
                {/* Nội thất */}
                {property.furnishings?.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Nội thất</Text>
                        <View style={styles.furnishingGrid}>
                            {property.furnishings.map((f, idx) => (
                                <View key={idx} style={styles.furnishingItem}>
                                    <Icon
                                        name={f.furnishingId?.icon || "sofa"} 
                                        size={28}
                                        color="#111"
                                    />
                                    <Text style={styles.furnishingLabel}>
                                        {f.furnishingId?.furnishingName || "Nội thất"}
                                        {f.quantity > 1 ? ` x${f.quantity}` : ""}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Chủ nhà */}
                <Text style={styles.sectionTitle}>Chủ nhà</Text>
                <View style={styles.infoRow}>
                    <Text>👤 {property.landlord?.fullName || "Ẩn danh"}</Text>
                    {property.landlord?.phoneNumber && (
                        <TouchableOpacity
                            onPress={() =>
                                Linking.openURL(
                                    `tel:${property.landlord.phoneNumber}`
                                )
                            }
                        >
                            <Text style={{ color: "#f36031" }}>
                                📞 {property.landlord.phoneNumber}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {property.landlord?.email && (
                        <Text>✉️ {property.landlord.email}</Text>
                    )}
                </View>

                {/* Mô tả */}
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <Text style={styles.description}>
                    {property.description || "Chưa có mô tả chi tiết"}
                </Text>
            </ScrollView>

            {/* Thanh Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.lightBtn}>
                    <Icon name="flag-outline" size={18} color="#f36031" />
                    <Text style={styles.lightBtnText}>Báo cáo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.lightBtn}>
                    <Icon name="message-text-outline" size={18} color="#f36031" />
                    <Text style={styles.lightBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn}>
                    <Icon name="calendar-check" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Đặt phòng</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default PropertyDetailScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ddd",
    },
    headerBtn: { width: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 16, fontWeight: "600" },

    // Image
    mainImage: {
        width: 320,
        height: 220,
        borderRadius: 12,
        marginRight: 12,
    },

    // Content
    title: { fontSize: 18, fontWeight: "700" },
    price: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 6,
        color: "#f36031",
    },
    subText: { fontSize: 14, color: "#555", marginVertical: 2 },

    detailGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 12,
        backgroundColor: "#f8f6f6",
        borderRadius: 8,
        marginHorizontal: 12,
    },
    detailItem: {
        flex: 1,
        alignItems: "center",
    },
    detailLabel: {
        fontSize: 13,
        color: "#444",
        marginTop: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 2,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 14,
        marginBottom: 6,
        paddingHorizontal: 12,
    },
    infoRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        paddingHorizontal: 12,
    },
    description: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    furnishingGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        marginTop: 6,
    },
    furnishingItem: {
        width: "30%", // 3 item / hàng
        alignItems: "center",
        marginVertical: 10,
    },
    furnishingLabel: {
        fontSize: 13,
        color: "#444",
        marginTop: 6,
        textAlign: "center",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        padding: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#ddd",
        backgroundColor: "#fff",
    },
    lightBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12
    },
    lightBtnText: {
        marginLeft: 6,
        color: "#f36031",
        fontWeight: "600"
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f36031",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    primaryBtnText: {
        marginLeft: 6,
        color: "#fff",
        fontWeight: "700"
    },
});
