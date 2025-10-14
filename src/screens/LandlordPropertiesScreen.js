import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import S3Image from "../components/S3Image";
import { resolveAssetUrl } from "../utils/cdn";
import { resolvePropertyTitle, resolvePropertyName } from "../utils/propertyDisplay";
import { recordUserEvent } from "../features/events/eventsThunks";
import { fetchPropertiesByLandlord } from "../features/properties/propertiesThunks";

const ORANGE = "#f97316";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const DEFAULT_FOLLOWERS = 128;

const formatPrice = (value) => {
    if (value === null || value === undefined) {
        return "Giá liên hệ";
    }

    const normalized = Number(value);
    if (!Number.isFinite(normalized)) {
        return "Giá liên hệ";
    }

    return `${normalized.toLocaleString("vi-VN")}đ/đêm`;
};

const formatAddress = (address) => {
    if (!address) {
        return "";
    }

    if (typeof address === "string") {
        return address.replace(/_/g, " ").trim();
    }

    return (
        address.addressFull ||
        [
            address.houseNumber,
            address.street,
            address.wardName,
            address.districtName,
            address.provinceName,
        ]
            .filter(Boolean)
            .join(", ")
    );
};

const getPrimaryMediaKey = (property) => {
    if (!property) {
        return null;
    }

    const { media, thumbnailUrl, thumbnail, coverImage } = property;

    if (thumbnailUrl) {
        return thumbnailUrl;
    }

    if (thumbnail) {
        return typeof thumbnail === "string" ? thumbnail : thumbnail?.url || null;
    }

    if (coverImage) {
        return typeof coverImage === "string"
            ? coverImage
            : coverImage?.url || coverImage?.path || null;
    }

    if (Array.isArray(media) && media.length > 0) {
        const first = media[0];
        if (typeof first === "string") {
            return first;
        }
        return first?.url || first?.path || null;
    }

    return null;
};

const LandlordPropertiesScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const {
        landlordId,
        landlord = {},
        stats = {},
        followerCount,
    } = route.params || {};

    const [refreshing, setRefreshing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const {
        landlordRooms = [],
        landlordBuildings = [],
        landlordRoomsTotal = 0,
        landlordBuildingsTotal = 0,
    } = useSelector((state) => state.properties);
    const properties = useMemo(
        () => [...landlordRooms, ...landlordBuildings].filter(Boolean),
        [landlordRooms, landlordBuildings]
    );
    const approvedRoomsTotal = Number.isFinite(Number(landlordRoomsTotal))
        ? Number(landlordRoomsTotal)
        : landlordRooms.length;
    const approvedBuildingsTotal = Number.isFinite(Number(landlordBuildingsTotal))
        ? Number(landlordBuildingsTotal)
        : landlordBuildings.length;
    const totalPosts = approvedRoomsTotal + approvedBuildingsTotal;

    const landlordName = landlord.fullName || landlord.name || "Ẩn danh";
    const landlordPhone = landlord.phoneNumber || landlord.phone || null;
    const avatarKey = landlord.avatarUrl || null;
    const avatarUrl = avatarKey ? resolveAssetUrl(avatarKey) : null;
    const displayFollowerCount =
        followerCount === undefined || followerCount === null
            ? DEFAULT_FOLLOWERS
            : followerCount;
    const totalReviews = Number.isFinite(Number(stats.totalReviews))
        ? Number(stats.totalReviews)
        : 0;
    const averageRatingValue = useMemo(() => {
        const raw = Number(stats.averageRating);
        return Number.isFinite(raw) && totalReviews > 0
            ? raw.toFixed(1)
            : null;
    }, [stats.averageRating, totalReviews]);

    const totalPostsLabel = useMemo(() => {
        if (!totalPosts) {
            return "Chưa có bài đăng";
        }
        if (totalPosts === 1) {
            return "1 bài đăng";
        }
        return `${totalPosts} bài đăng`;
    }, [totalPosts]);

    const averageRatingLabel = averageRatingValue
        ? `${averageRatingValue}/5 điểm`
        : "Chưa có đánh giá";
    const totalReviewsLabel = `${totalReviews} đánh giá`;

    const fetchProperties = useCallback(() => {
        if (!landlordId) {
            return Promise.resolve();
        }

        setFetchError(null);
        setIsFetching(true);

        const requestConfigs = [
            { type: "ROOM", postStatus: "APPROVED" },
            { type: "BUILDING", postStatus: "APPROVED" },
        ];

        const requests = requestConfigs.map(({ type, postStatus }) =>
            dispatch(
                fetchPropertiesByLandlord({
                    landlordId,
                    page: 0,
                    size: 50,
                    type,
                    postStatus,
                })
            ).unwrap()
        );

        return Promise.all(requests)
            .catch((error) => {
                const message =
                    error?.message ||
                    error?.error ||
                    (typeof error === "string" ? error : null);
                setFetchError(message || "Đã có lỗi xảy ra");
                return [];
            })
            .finally(() => {
                setIsFetching(false);
            });
    }, [dispatch, landlordId]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProperties()
            .catch(() => {})
            .finally(() => {
                setRefreshing(false);
            });
    }, [fetchProperties]);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleCall = useCallback(() => {
        if (!landlordPhone) {
            return;
        }

        Linking.openURL(`tel:${landlordPhone}`);
    }, [landlordPhone]);

    const handleOpenProperty = useCallback(
        (property) => {
            if (!property) {
                return;
            }

            const propertyId = property.propertyId || property.id;
            if (!propertyId) {
                return;
            }

            dispatch(
                recordUserEvent({
                    eventType: "VIEW",
                    roomId: propertyId,
                    metadata: { from: "landlord-properties" },
                })
            );

            navigation.navigate("PropertyDetail", {
                propertyId,
                loggedViewEvent: true,
            });
        },
        [dispatch, navigation]
    );

    const renderPropertyItem = useCallback(
        ({ item }) => {
            const mediaKey = getPrimaryMediaKey(item);
            const mediaUrl = mediaKey ? resolveAssetUrl(mediaKey) : null;
            const address = formatAddress(item.address);
            const priceLabel = formatPrice(item.price || item.minPrice || item.pricePerMonth);
            const propertyType =
                item.propertyType || item.type || item.category || "Bất động sản";

            return (
                <TouchableOpacity
                    style={styles.propertyCard}
                    activeOpacity={0.85}
                    onPress={() => handleOpenProperty(item)}
                >
                    <View style={styles.propertyImageWrapper}>
                        {mediaUrl ? (
                            <S3Image src={mediaUrl} style={styles.propertyImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="home-outline" size={24} color={GRAY} />
                            </View>
                        )}
                    </View>
                    <View style={styles.propertyInfo}>
                        <Text style={styles.propertyTitle} numberOfLines={2}>
                            {resolvePropertyTitle(item)}
                        </Text>
                        <Text style={styles.propertyName} numberOfLines={1}>
                            {resolvePropertyName(item)}
                        </Text>
                        {address ? (
                            <Text style={styles.propertyAddress} numberOfLines={1}>
                                {address}
                            </Text>
                        ) : null}
                        <Text style={styles.propertyPrice}>{priceLabel}</Text>
                    </View>
                </TouchableOpacity>
            );
        },
        [handleOpenProperty]
    );

    const listHeader = useMemo(() => {
        return (
            <View style={styles.landlordSection}>
                <View style={styles.landlordCard}>
                    <View style={styles.landlordAvatarWrapper}>
                        {avatarUrl ? (
                            <S3Image src={avatarUrl} style={styles.landlordAvatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Ionicons name="person" size={28} color={ORANGE} />
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.landlordName}>{landlordName}</Text>
                        {landlordPhone ? (
                            <TouchableOpacity
                                style={styles.contactRow}
                                onPress={handleCall}
                            >
                                <Ionicons
                                    name="call-outline"
                                    size={16}
                                    color={ORANGE}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={styles.contactText}>{landlordPhone}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.contactPlaceholder}>
                                Chưa cập nhật số điện thoại
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.statGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="star" size={18} color={ORANGE} />
                        <Text style={styles.statLabel}>Trung bình</Text>
                        <Text style={styles.statValue}>{averageRatingLabel}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="chatbubbles-outline" size={18} color={ORANGE} />
                        <Text style={styles.statLabel}>Tổng đánh giá</Text>
                        <Text style={styles.statValue}>{totalReviewsLabel}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people-outline" size={18} color={ORANGE} />
                        <Text style={styles.statLabel}>Người theo dõi</Text>
                        <Text style={styles.statValue}>
                            {displayFollowerCount.toLocaleString("vi-VN")}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="home" size={18} color={ORANGE} />
                        <Text style={styles.statLabel}>Bài đăng</Text>
                        <Text style={styles.statValue}>{totalPostsLabel}</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bài đăng của chủ nhà</Text>
                    {fetchError ? (
                        <TouchableOpacity onPress={fetchProperties}>
                            <Text style={styles.retryText}>Thử lại</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                {fetchError ? (
                    <Text style={styles.errorText}>{fetchError}</Text>
                ) : null}
            </View>
        );
    }, [
        avatarUrl,
        landlordName,
        landlordPhone,
        handleCall,
        averageRatingLabel,
        totalReviewsLabel,
        displayFollowerCount,
        totalPostsLabel,
        fetchError,
        fetchProperties,
    ]);

    const listEmptyComponent = useMemo(() => {
        if (isFetching || refreshing) {
            return null;
        }

        return (
            <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={32} color={GRAY} />
                <Text style={styles.emptyTitle}>Chưa có bài đăng</Text>
                <Text style={styles.emptySubtitle}>
                    Chủ nhà hiện chưa có bất kỳ bất động sản nào được đăng tải.
                </Text>
            </View>
        );
    }, [isFetching, refreshing]);

    const contentPadding = useMemo(
        () => ({ paddingBottom: Math.max(insets.bottom, 16) + 24 }),
        [insets.bottom]
    );

    const showInitialLoading = isFetching && !refreshing && properties.length === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.header, { paddingTop: insets.top || 12 }]}> 
                <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chủ nhà</Text>
                <View style={{ width: 32 }} />
            </View>
            {showInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={ORANGE} />
                    <Text style={styles.loadingText}>Đang tải bài đăng...</Text>
                </View>
            ) : (
                <FlatList
                    data={properties}
                    keyExtractor={(item, index) =>
                        String(item?.propertyId || item?.id || index)
                    }
                    renderItem={renderPropertyItem}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={listEmptyComponent}
                    contentContainerStyle={[styles.listContent, contentPadding]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={ORANGE}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.itemDivider} />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderBottomColor: "#F3F4F6",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBackButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: GRAY,
    },
    landlordSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
    },
    landlordCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    landlordAvatarWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: "hidden",
        marginRight: 16,
        backgroundColor: "#FFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    landlordAvatar: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholderAvatar: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    landlordName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    contactText: {
        fontSize: 15,
        color: ORANGE,
        fontWeight: "600",
    },
    contactPlaceholder: {
        fontSize: 14,
        color: GRAY,
    },
    statGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 16,
        justifyContent: "space-between",
    },
    statCard: {
        width: "48%",
        backgroundColor: "#FFF",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 13,
        color: GRAY,
        marginTop: 6,
    },
    statValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginTop: 4,
    },
    sectionHeader: {
        marginTop: 28,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    retryText: {
        fontSize: 14,
        color: ORANGE,
        fontWeight: "600",
    },
    errorText: {
        fontSize: 14,
        color: "#DC2626",
        marginTop: -4,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    propertyCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 12,
    },
    propertyImageWrapper: {
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        marginRight: 12,
    },
    propertyImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholderImage: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    propertyInfo: {
        flex: 1,
        justifyContent: "space-between",
    },
    propertyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    propertyName: {
        fontSize: 13,
        color: "#111827",
        marginBottom: 6,
    },
    propertyAddress: {
        fontSize: 13,
        color: GRAY,
        marginBottom: 6,
    },
    propertyPrice: {
        fontSize: 15,
        fontWeight: "700",
        color: ORANGE,
        marginBottom: 8,
    },
    propertyMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 2,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF7ED",
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 8,
        marginTop: 6,
    },
    metaText: {
        fontSize: 12,
        fontWeight: "600",
        color: ORANGE,
        marginLeft: 4,
    },
    itemDivider: {
        height: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: GRAY,
        marginTop: 6,
        textAlign: "center",
        lineHeight: 18,
    },
});

export default LandlordPropertiesScreen;