import React, { useState, useEffect , useRef, useCallback } from "react";
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
    Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MapView, { Marker } from "react-native-maps";
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
    const [bookingSelection, setBookingSelection] = useState({
        startDate: null,
        endDate: null,
        nights: 0,
    });

    const handleBookingSectionLayout = (event) => {
        bookingSectionYRef.current = event?.nativeEvent?.layout?.y ?? 0;
    };

    const handleScrollToBooking = () => {
        const y = bookingSectionYRef.current ?? 0;
        scrollViewRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    };

    const handleBookingSelectionChange = useCallback(({ startDate, endDate, nights }) => {
        setBookingSelection({
            startDate: startDate || null,
            endDate: endDate || null,
            nights: nights || 0,
        });
    }, []);

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

    const formatTotalPrice = (price, nights) => {
        if (!price || nights <= 0) {
            return null;
        }

        const total = Number(price) * nights;
        if (Number.isNaN(total)) {
            return null;
        }

        return `${total.toLocaleString("vi-VN")} đ`;
    };

    const formatBookingRangeLabel = (startKey, endKey, nights) => {
        if (!startKey || !endKey || nights <= 0) {
            return null;
        }

        const startDate = new Date(`${startKey}T00:00:00`);
        const endDate = new Date(`${endKey}T00:00:00`);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return null;
        }

        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const startMonth = startDate.getMonth() + 1;
        const endMonth = endDate.getMonth() + 1;
        const startMonthLabel = `thg ${startMonth}`;
        const endMonthLabel = `thg ${endMonth}`;

        if (startMonth === endMonth) {
            return `Cho ${nights} đêm ${startDay}-${endDay} ${endMonthLabel}`;
        }

        return `Cho ${nights} đêm ${startDay} ${startMonthLabel}-${endDay} ${endMonthLabel}`;
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) {
            return null;
        }

        const number = Number(value);
        if (Number.isNaN(number)) {
            return null;
        }

        return `${number.toLocaleString("vi-VN")} đ`;
    };

    const getChargeBasisLabel = (basis) => {
        const mapping = {
            FIXED: "trọn gói",
            PER_PERSON: "mỗi người",
            PER_ROOM: "mỗi phòng",
            OTHER: "khác",
        };

        return mapping[basis] || null;
    };

    const getServiceIconName = (serviceName = "") => {
        const normalized = serviceName.toLowerCase();

        if (normalized.includes("dọn") || normalized.includes("vệ sinh")) {
            return "broom";
        }

        if (normalized.includes("an ninh") || normalized.includes("bảo vệ")) {
            return "shield-check";
        }

        if (normalized.includes("giặt")) {
            return "washing-machine";
        }

        if (normalized.includes("internet") || normalized.includes("wifi")) {
            return "wifi";
        }

        if (normalized.includes("điện")) {
            return "flash";
        }

        if (normalized.includes("nước")) {
            return "water";
        }

        if (normalized.includes("giữ xe") || normalized.includes("đỗ xe") || normalized.includes("parking")) {
            return "car";
        }

        return "clipboard-check";
    };

    const getFurnishingIconName = (name = "") => {
        const normalized = name.toLowerCase();

        if (normalized.includes("tủ lạnh")) {
            return "fridge";
        }

        if (normalized.includes("máy lạnh") || normalized.includes("điều hòa")) {
            return "air-conditioner";
        }

        if (normalized.includes("máy giặt")) {
            return "washing-machine";
        }

        if (normalized.includes("tivi") || normalized.includes("tv")) {
            return "television-classic";
        }

        if (normalized.includes("bếp")) {
            return "stove";
        }

        if (normalized.includes("giường") || normalized.includes("nệm")) {
            return "bed-queen";
        }

        if (normalized.includes("tủ quần áo") || normalized.includes("tủ")) {
            return "wardrobe";
        }

        if (normalized.includes("bàn") || normalized.includes("ghế")) {
            return "table-furniture";
        }

        return "sofa";
    };

    const renderServiceFee = (service) => {
        if (service.isIncluded) {
            return "Đã bao gồm trong giá";
        }

        const formatted = formatCurrency(service.fee);
        if (!formatted) {
            return "Liên hệ để biết phí";
        }

        const basisLabel = getChargeBasisLabel(service.chargeBasis);
        return basisLabel ? `${formatted} · ${basisLabel}` : formatted;
    };

    const renderFurnishingSubtitle = (furnishing) => {
        if (furnishing.quantity && furnishing.quantity > 1) {
            return `Số lượng: ${furnishing.quantity}`;
        }

        return "Sẵn sàng sử dụng";
    };

    const totalPriceLabel = formatTotalPrice(property.price, bookingSelection.nights);
    const bookingRangeLabel = formatBookingRangeLabel(
        bookingSelection.startDate,
        bookingSelection.endDate,
        bookingSelection.nights
    );

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
                <View style={styles.summaryCard}>
                    <Text style={styles.title} numberOfLines={2}>
                        {property.title || "Phòng cho thuê"}
                    </Text>
                    {property.buildingName ? (
                        <Text style={styles.buildingName} numberOfLines={2}>
                            {property.buildingName}
                        </Text>
                    ) : null}
                    <View style={styles.priceRow}>
                        <Icon name="cash" size={20} color="#f36031" />
                        <Text style={styles.price}>{formatPriceWithUnit(property)}</Text>
                    </View>
                    <View style={styles.ratingBadgeRow}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#f5a623" />
                            <Text style={styles.ratingBadgeText}>
                                {isReviewsLoading
                                    ? "Đang tải"
                                    : reviewsStatus === "failed"
                                    ? "Không thể tải"
                                    : reviewsSummary.total > 0
                                    ? Number(reviewsSummary.average || 0).toFixed(1)
                                    : "--"}
                            </Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Icon name="crown" size={18} color="#f5a623" />
                            <Text style={styles.ratingBadgeText}>Được khách yêu thích</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Icon name="comment-text-multiple-outline" size={18} color="#f5a623" />
                            <Text style={styles.ratingBadgeText}>
                                {isReviewsLoading
                                    ? "-- đánh giá"
                                    : reviewsStatus === "failed"
                                    ? "Lỗi"
                                    : `${reviewsSummary.total || 0} đánh giá`}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="account-group" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.capacity ? `${property.capacity} khách` : "Đang cập nhật"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="bed-outline" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.bedrooms ? `${property.bedrooms} phòng ngủ` : "Chưa rõ"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="shower" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.bathrooms
                                    ? `${property.bathrooms} phòng tắm`
                                    : "Chưa rõ"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="stairs-up" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.floorNo ? `Tầng ${property.floorNo}` : "Không rõ tầng"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="ruler-square" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.area ? `${property.area} m²` : "Chưa rõ diện tích"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                        <Text style={[styles.subText, { flex: 1 }]} numberOfLines={2}>
                            {addressFormatted}
                        </Text>
                    </View>
                </View>
            
                {/* Nội thất */}
                {property.furnishings?.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Nội thất & tiện nghi</Text>
                        <View style={styles.infoList}>
                            {property.furnishings.map((furnishing, idx) => (
                                <View
                                    key={furnishing.id || `${furnishing.furnishingId || idx}`}
                                    style={[
                                        styles.infoCard,
                                        idx === property.furnishings.length - 1
                                            ? styles.infoCardLast
                                            : null,
                                    ]}
                                >
                                    <View style={styles.infoIconWrapper}>
                                        <Icon
                                            name={getFurnishingIconName(
                                                furnishing.furnishingName || ""
                                            )}
                                            size={22}
                                            color="#f36031"
                                        />
                                    </View>
                                    <View style={styles.infoCardBody}>
                                        <Text style={styles.infoCardTitle}>
                                            {furnishing.furnishingName || "Nội thất"}
                                        </Text>
                                        <Text style={styles.infoCardSubtitle}>
                                            {renderFurnishingSubtitle(furnishing)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Dịch vụ */}
                {property.services?.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Dịch vụ đi kèm</Text>
                        <View style={styles.infoList}>
                            {property.services.map((service, idx) => (
                                <View
                                    key={service.id || `${service.serviceName || idx}`}
                                    style={[
                                        styles.infoCard,
                                        idx === property.services.length - 1
                                            ? styles.infoCardLast
                                            : null,
                                    ]}
                                >
                                    <View style={styles.infoIconWrapper}>
                                        <Icon
                                            name={getServiceIconName(service.serviceName || "")}
                                            size={22}
                                            color="#0ea5e9"
                                        />
                                    </View>
                                    <View style={styles.infoCardBody}>
                                        <Text style={styles.infoCardTitle}>
                                            {service.serviceName || "Dịch vụ"}
                                        </Text>
                                        <Text style={styles.infoCardSubtitle}>
                                            {renderServiceFee(service)}
                                        </Text>
                                        {service.note ? (
                                            <Text style={styles.infoCardNote}>{service.note}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {Platform.OS !== "web" && (
                    <View style={{ height: 300, width: "100%" }}>
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                        latitude: 10.776889,
                        longitude: 106.700806,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                        }}
                    >
                    <Marker coordinate={{ latitude: 10.776889, longitude: 106.700806 }} title="HCMC" />
                    </MapView>
                    </View>
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
                        <PropertyBookingSection
                            propertyId={property.propertyId}
                            onSelectionChange={handleBookingSelectionChange}
                        />
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
                    <View style={styles.priceSummary}>
                        <Text
                            style={[
                                styles.priceSummaryValue,
                                totalPriceLabel ? styles.priceSummaryValueHighlight : null,
                            ]}
                        >
                            {totalPriceLabel || "Chọn ngày để xem giá"}
                        </Text>
                        {bookingRangeLabel ? (
                            <Text style={styles.priceSummarySubtitle}>{bookingRangeLabel}</Text>
                        ) : null}
                    </View>
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
        borderRadius: 0,
    },

    // Content
    summaryCard: {
        padding: 12,
        alignItems: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 4,
        color: "#111",
    },
    buildingName: {
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    price: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 6,
        color: "#f36031",
    },
    ratingBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 12,
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff7ed",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginHorizontal: 4,
        marginVertical: 4,
    },
    ratingBadgeText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
        color: "#b45309",
    },
    subText: { fontSize: 14, color: "#555", marginVertical: 2, textAlign: "center" },
    metaRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 6,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 8,
        marginVertical: 4,
    },
    metaText: {
        marginLeft: 6,
        color: "#374151",
        fontSize: 14,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },

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
    infoList: {
        paddingHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    infoCardLast: {
        marginBottom: 0,
    },
    infoIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
    },
    infoCardBody: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    infoCardSubtitle: {
        fontSize: 13,
        color: "#4b5563",
    },
    infoCardNote: {
        marginTop: 4,
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 18,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#ddd",
        backgroundColor: "#ffffffff",
        borderRadius: 15
    },
    lightBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#f36031",
        marginRight: 12,
    },
    lightBtnText: {
        marginLeft: 6,
        color: "#f36031",
        fontWeight: "600",
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f36031",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 25,
    },
    primaryBtnText: {
        marginLeft: 6,
        color: "#fff",
        fontWeight: "700",
    },
    priceSummary: {
        flex: 1,
        marginRight: 12,
        justifyContent: "center",
    },
    priceSummaryValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111",
    },
    priceSummaryValueHighlight: {
        color: "#f36031",
    },
    priceSummarySubtitle: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
});
