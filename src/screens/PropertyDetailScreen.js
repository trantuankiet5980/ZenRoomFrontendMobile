import React, { useState, useEffect , useRef} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Linking,
    Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch, useSelector } from "react-redux";
import { fetchPropertyDetail } from "../features/properties/propertiesThunks";
import { resetProperty } from "../features/properties/propertiesSlice";
import useHideTabBar from '../hooks/useHideTabBar';
import { Ionicons } from "@expo/vector-icons";
import { addFavorite, removeFavorite } from "../features/favorites/favoritesThunks";
import { useRole } from "../hooks/useRole";
import { Video } from "expo-av";
import S3Image from "../components/S3Image";
import { resolveAssetUrl } from "../utils/cdn";
import { sendMessage } from "../features/chat/chatThunks";
import { showToast } from "../utils/AppUtils";
import { pushServerMessage } from "../features/chat/chatSlice";
import { fetchPropertyReviewsSummary } from "../features/reviews/reviewsThunks";
import { resetReviewsSummary } from "../features/reviews/reviewsSlice";
import PropertyBookingSection from "../components/property/PropertyBookingSection";
const { width } = Dimensions.get('window');

const PropertyDetailScreen = ({ route, navigation }) => {
    useHideTabBar();
    const { propertyId } = route.params;
    const [liked, setLiked] = useState(false);
    const [expandedReviews, setExpandedReviews] = useState({});
    const dispatch = useDispatch();
    const { current: property, loading, error } = useSelector(
        (state) => state.properties
    );
    const { isTenant } = useRole();
    const currentUser = useSelector((s) => s.auth.user);
    const favorites = useSelector((state) => state.favorites.items);
    const reviewsSummary = useSelector(
        (state) => state.reviews.summaries[propertyId] || { average: 0, total: 0 }
    );
    const reviewsData = useSelector(
        (state) => state.reviews.lists?.[propertyId] || { items: [], total: 0 }
    );
    const reviewsStatus = useSelector((state) => state.reviews.status[propertyId]);
    const reviewsError = useSelector((state) => state.reviews.error[propertyId]);
    const isReviewsLoading = reviewsStatus === "loading";
    const propertyReviews = reviewsData.items || [];
    const MAX_COMMENT_LENGTH = 160;

    const scrollViewRef = useRef(null);
    const bookingSectionYRef = useRef(null);

    const handleBookingSectionLayout = (event) => {
        bookingSectionYRef.current = event?.nativeEvent?.layout?.y ?? 0;
    };

    const handleScrollToBooking = () => {
        const y = bookingSectionYRef.current ?? 0;
        scrollViewRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    };

    useEffect(() => {
        setExpandedReviews({});
    }, [propertyId]);

    const formatReviewDate = (value) => {
        if (!value) {
            return "--";
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString("vi-VN");
    };

    const shouldTruncateComment = (comment) =>
        typeof comment === "string" && comment.length > MAX_COMMENT_LENGTH;

    const getDisplayedComment = (comment, isExpanded) => {
        if (typeof comment !== "string") {
            return "";
        }

        if (isExpanded || comment.length <= MAX_COMMENT_LENGTH) {
            return comment;
        }

        return `${comment.slice(0, MAX_COMMENT_LENGTH).trimEnd()}...`;
    };

    const toggleReviewExpansion = (reviewKey) => {
        setExpandedReviews((prev) => ({
            ...prev,
            [reviewKey]: !prev[reviewKey],
        }));
    };

    useEffect(() => {
        if (property) {
            const isFav = favorites.some((f) => f.property.propertyId === property.propertyId);
            setLiked(isFav);
        }
    }, [favorites, property]);

    useEffect(() => {
        dispatch(fetchPropertyDetail(propertyId));
        return () => {
            dispatch(resetProperty());
        };
    }, [dispatch, propertyId]);

    useEffect(() => {
        if (property?.media) {
            // console.log("MEDIA LIST:", property.media);
        }
    }, [property]);

    useEffect(() => {
        if (!propertyId) {
            return;
        }

        dispatch(fetchPropertyReviewsSummary(propertyId));

        return () => {
            dispatch(resetReviewsSummary(propertyId));
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
            ? property.media.map((m) => ({
                ...m,
                fullUrl: resolveAssetUrl(m.url),
                poster: m.posterUrl ? resolveAssetUrl(m.posterUrl) : null,
            }))
            : [
                {
                    fullUrl: "https://picsum.photos/600/400",
                    mediaType: "IMAGE",
                },
            ];
    const formatPriceWithUnit = (property) => {
        if (!property?.price) return "Giá liên hệ";
        const formatted = Number(property.price).toLocaleString("vi-VN");
        return property.propertyType === "ROOM"
            ? `${formatted} đ/tháng`
            : `${formatted} đ/đêm`;
    };


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

                {/* <Text style={styles.headerTitle} numberOfLines={1}>
                    Chi tiết phòng
                </Text> */}

                <View style={{ flexDirection: "row" }}>
                    {/* Share */}
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => console.log("Share property", propertyId)}
                    >
                        <Icon name="share-variant" size={22} color="#111" />
                    </TouchableOpacity>

                    {/* Yêu thích */}
                    {isTenant && (
                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={async () => {
                                if (liked) {
                                    const fav = favorites.find(
                                        (f) =>
                                            f.property.propertyId ===
                                            property.propertyId
                                    );
                                    if (fav) {
                                        try {
                                            await dispatch(
                                                removeFavorite(property.propertyId)
                                            ).unwrap();
                                            setLiked(false);
                                        } catch (error) {
                                            console.warn(
                                                "Xoá yêu thích thất bại:",
                                                error?.message || error
                                            );
                                            alert("Không thể xóa khỏi danh sách yêu thích");
                                        }
                                    }
                                } else {
                                    try {
                                        await dispatch(
                                            addFavorite(property.propertyId)
                                        ).unwrap();
                                        setLiked(true);
                                    } catch (error) {
                                        alert(
                                            error?.message ||
                                            "Không thể thêm vào danh sách yêu thích"
                                        );
                                    }
                                }
                            }}
                        >
                            <Icon
                                name={liked ? "heart" : "heart-outline"}
                                size={24}
                                color="#f36031"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={[styles.container, { paddingTop: 15 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Media gallery */}
                <FlatList
                    horizontal
                    data={mediaList}
                    keyExtractor={(item, index) =>
                        item.mediaId || index.toString()
                    }
                    renderItem={({ item }) =>
                        item.mediaType === "VIDEO" ? (
                            <Video
                                source={{ uri: item.fullUrl }}
                                style={styles.mainImage}
                                useNativeControls
                                resizeMode="cover"
                                posterSource={
                                    item.poster ? { uri: item.poster } : null
                                }
                                posterStyle={styles.mainImage}
                                onError={(e) =>
                                    console.warn("VIDEO ERROR:", e)
                                }
                            />
                        ) : (
                            <S3Image
                                src={item.fullUrl}
                                style={styles.mainImage}
                                alt={item.mediaId}
                            />
                        )
                    }
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    snapToInterval={width}
                    decelerationRate="fast"
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
                            {formatPriceWithUnit(property)}
                        </Text>
                    </View>
                    <View style={styles.ratingRow}>
                        <Ionicons
                            name="star"
                            size={16}
                            color="#f5a623"
                            style={{ marginRight: 4 }}
                        />
                        {isReviewsLoading ? (
                            <Text style={styles.ratingText}>
                                Đang tải đánh giá...
                            </Text>
                        ) : reviewsStatus === "failed" ? (
                            <Text style={styles.ratingText}>
                                {reviewsError || "Không thể tải đánh giá"}
                            </Text>
                        ) : reviewsSummary.total > 0 ? (
                            <Text style={styles.ratingText}>
                                {Number(
                                    reviewsSummary.average || 0
                                ).toFixed(1)} ({reviewsSummary.total} đánh giá)
                            </Text>
                        ) : (
                            <Text style={styles.ratingText}>
                                Chưa có đánh giá
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color="#555"
                            style={{ marginRight: 4 }}
                        />
                        <Text style={styles.subText}>{addressFormatted}</Text>
                    </View>
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
                    {property.propertyType !== "BUILDING" && (
                        <View style={styles.detailItem}>
                            <Icon name="account-group" size={24} color="#111" />
                            <Text style={styles.detailLabel}>Số người</Text>
                            <Text style={styles.detailValue}>
                                {property.capacity || "N/A"}
                            </Text>
                        </View>
                    )}

                    {/* <View style={styles.detailItem}>
                        <Icon name="cash-multiple" size={24} color="#111" />
                        <Text style={styles.detailLabel}>Đặt cọc</Text>
                        <Text style={styles.detailValue}>
                            {property.deposit
                                ? `${Number(property.deposit).toLocaleString("vi-VN")} đ`
                                : "Thỏa thuận"}
                        </Text>
                    </View> */}
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
                                        {f.furnishingName}
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
                            onPress={() => Linking.openURL(`tel:${property.landlord.phoneNumber}`)}
                        >
                            <Text style={{ color: "#f36031" }}>📞 {property.landlord.phoneNumber}</Text>
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
                {isTenant && (
                    <View
                        onLayout={handleBookingSectionLayout}
                        style={{ paddingHorizontal: 12 }}
                    >
                        <PropertyBookingSection propertyId={property.propertyId} />
                    </View>
                )}
                <Text style={styles.sectionTitle}>Đánh giá</Text>
                {isReviewsLoading ? (
                    <Text style={styles.reviewsStatusText}>Đang tải đánh giá...</Text>
                ) : reviewsStatus === "failed" ? (
                    <Text style={[styles.reviewsStatusText, { color: "#d9534f" }]}>
                        {reviewsError || "Không thể tải đánh giá"}
                    </Text>
                ) : propertyReviews.length > 0 ? (
                    <View style={styles.reviewsContainer}>
                        {propertyReviews.map((review, index) => {
                            const reviewKey = review.reviewId || `${propertyId}-${index}`;
                            const isExpanded = !!expandedReviews[reviewKey];
                            const comment = getDisplayedComment(
                                review.comment,
                                isExpanded
                            );
                            const showToggle = shouldTruncateComment(review.comment);

                            return (
                                <View
                                    key={reviewKey}
                                    style={[
                                        styles.reviewCard,
                                        index !== propertyReviews.length - 1 &&
                                            styles.reviewCardSpacing,
                                    ]}
                                >
                                    <View style={styles.reviewHeader}>
                                        <Ionicons
                                            name="person-circle-outline"
                                            size={36}
                                            color="#a0a0a0"
                                            style={{ marginRight: 10 }}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewName} numberOfLines={1}>
                                                {review?.tenant?.fullName ||
                                                    review?.booking?.tenant?.fullName ||
                                                    "Người dùng ẩn danh"}
                                            </Text>
                                            <Text style={styles.reviewDate}>
                                                {formatReviewDate(review.createdAt)}
                                            </Text>
                                        </View>
                                        <View style={styles.reviewRating}>
                                            <Ionicons
                                                name="star"
                                                size={16}
                                                color="#f5a623"
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={styles.reviewRatingValue}>
                                                {Number(review.rating || 0).toFixed(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    {comment ? (
                                        <View style={styles.reviewBody}>
                                            <Text style={styles.reviewComment}>{comment}</Text>
                                            {showToggle && (
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        toggleReviewExpansion(reviewKey)
                                                    }
                                                >
                                                    <Text style={styles.reviewToggle}>
                                                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.reviewsStatusText}>Chưa có đánh giá</Text>
                )}
            </ScrollView>

            {/* Thanh Action */}
            {isTenant ? (
                // Người thuê -> báo cáo, chat, đặt phòng
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.lightBtn}>
                        <Icon name="flag-outline" size={18} color="#f36031" />
                        <Text style={styles.lightBtnText}>Báo cáo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.lightBtn}
                        onPress={async () => {
                            try {
                                const { serverMessage } = await dispatch(
                                    sendMessage({
                                        propertyId: property.propertyId,
                                        content: "Xin chào anh/chị, phòng này còn trống không?",
                                    })
                                ).unwrap();

                                const convId =
                                    serverMessage?.conversation?.conversationId ||
                                    serverMessage?.conversationId;

                                // ĐẨY NGAY bubble chào vào Redux để ChatDetail hiện tức thì
                                if (convId) {
                                    // cập nhật lastMessage cho list + thêm message vào bucket
                                    dispatch(pushServerMessage(serverMessage));

                                    const mini = {
                                        propertyId: property.propertyId,
                                        title: property.title,
                                        address: property.address?.addressFull,
                                        price: property.price,
                                        thumbnail:
                                            (property.media?.find((m) => m.mediaType === "IMAGE")?.url) ||
                                            property.media?.[0]?.url ||
                                            null,
                                        landlordName: property.landlord?.fullName,
                                    };

                                    navigation.navigate("ChatDetail", {
                                        conversationId: convId,
                                        title: property.landlord?.fullName || "Chủ nhà",
                                        avatar: property.landlord?.avatarUrl || null,
                                        propertyId: property.propertyId,
                                        propertyMini: mini,
                                        initialMessage: serverMessage, // optional: để ChatDetail không phải đợi fetch
                                    });
                                } else {
                                    showToast("error", "top", "Thông báo", "Không lấy được hội thoại");
                                }
                            } catch (err) {
                                console.warn("Tạo chat thất bại:", err?.message || err);
                                showToast("error", "top", "Thông báo", "Không thể bắt đầu trò chuyện");
                            }
                        }}
                    >
                        <Icon name="message-text-outline" size={18} color="#f36031" />
                        <Text style={styles.lightBtnText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleScrollToBooking}
                    >
                        <Icon name="calendar-check" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>Chọn ngày</Text>
                    </TouchableOpacity>
                </View>
            ) : String(property.landlord?.userId) === String(currentUser?.userId) ? (
                // Chủ nhà -> nếu là phòng của chính mình
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => {
                            if (property.propertyType === "ROOM") {
                                navigation.navigate("CreatePostStack", {
                                    screen: "CreateRoom",
                                    params: { mode: "update", property: property }
                                });

                            } else if (property.propertyType === "BUILDING") {
                                navigation.navigate("CreatePostStack", {
                                    screen: "CreateBuilding",
                                    params: { mode: "update", property: property }
                                });
                            }
                        }}
                    >
                        <Icon name="pencil" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>Cập nhật</Text>
                    </TouchableOpacity>

                </View>
            ) : null}
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
        width: width,
        height: 400,
        borderRadius: 0
    },

    // Content
    title: { fontSize: 18, fontWeight: "700" },
    price: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 6,
        color: "#f36031",
    },
        ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 14,
        color: "#444",
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
    reviewsStatusText: {
        paddingHorizontal: 12,
        fontSize: 14,
        color: "#555",
        marginBottom: 12,
    },
    reviewsContainer: {
        paddingHorizontal: 12,
        paddingBottom: 4,
    },
    reviewCard: {
        backgroundColor: "#f7f7f7",
        borderRadius: 12,
        padding: 12,
    },
    reviewCardSpacing: {
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    reviewName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222",
    },
    reviewDate: {
        fontSize: 12,
        color: "#777",
        marginTop: 2,
    },
    reviewRating: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 12,
    },
    reviewRatingValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    reviewBody: {
        marginTop: 10,
    },
    reviewComment: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
    },
    reviewToggle: {
        marginTop: 6,
        color: "#f36031",
        fontWeight: "600",
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
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        padding: 15,
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
