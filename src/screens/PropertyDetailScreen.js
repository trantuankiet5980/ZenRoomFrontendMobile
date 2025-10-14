import React, { useState, useEffect, useRef, useCallback } from "react";
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
    Alert,
    TouchableWithoutFeedback,
    TextInput,
    ActivityIndicator,
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
import { resolvePropertyTitle, resolvePropertyName } from "../utils/propertyDisplay";
import { sendMessage } from "../features/chat/chatThunks";
import { showToast } from "../utils/AppUtils";
import { pushServerMessage } from "../features/chat/chatSlice";
import { fetchSimilarRecommendations } from "../features/recommendations/recommendationsThunks";
import { clearSimilarRecommendations } from "../features/recommendations/recommendationsSlice";
import { recordUserEvent } from "../features/events/eventsThunks";
import {
    fetchPropertyReviewsSummary,
    updateReviewThunk,
    deleteReviewThunk,
    submitReviewReplyThunk,
    fetchLandlordReviewStats,
 } from "../features/reviews/reviewsThunks";
import { resetReviewsSummary, resetLandlordStats } from "../features/reviews/reviewsSlice";
import ReviewModal from "../components/reviews/ReviewModal";
import PropertyBookingSection from "../components/property/PropertyBookingSection";
const { width } = Dimensions.get('window');

const DEFAULT_MAP_REGION = {
    latitude: 21.027763,
    longitude: 105.83416,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const parseCoordinate = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const PropertyDetailScreen = ({ route, navigation }) => {
    useHideTabBar();
    const { propertyId } = route.params;
    const loggedViewEvent = Boolean(route?.params?.loggedViewEvent);
    const highlightReviewIdParam = route?.params?.highlightReviewId;
    const scrollToReviewsParam = route?.params?.scrollToReviews;
    const [liked, setLiked] = useState(false);
    const [expandedReviews, setExpandedReviews] = useState({});
    const [visibleReviewCount, setVisibleReviewCount] = useState(3);
    const [highlightedReviewId, setHighlightedReviewId] = useState(
        highlightReviewIdParam || null
    );
    const [reviewMenuVisibleId, setReviewMenuVisibleId] = useState(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [activeReplyReviewId, setActiveReplyReviewId] = useState(null);
    const [replyInputValue, setReplyInputValue] = useState("");
    const [replyInputError, setReplyInputError] = useState("");
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const dispatch = useDispatch();
    const propertiesState = useSelector((state) => state.properties || {});
    const { current, byId = {}, loading = false, error = null } = propertiesState;
    const propertyFromMap = byId[propertyId];
    const property =
        propertyFromMap ||
        (current?.propertyId === propertyId ? current : null);
    const { isTenant, isLandlord } = useRole();
    const currentUser = useSelector((s) => s.auth.user);
    const favorites = useSelector((state) => state.favorites.items);
    const similarState =
        useSelector((state) => state.recommendations?.similar) || {};
    const {
        items: similarRecommendations = [],
        loading: similarLoading = false,
        error: similarError = null,
    } = similarState;
    const reviewsSummary = useSelector(
        (state) => state.reviews.summaries[propertyId] || { average: 0, total: 0 }
    );
    const reviewsData = useSelector(
        (state) => state.reviews.lists?.[propertyId] || { items: [], total: 0 }
    );
    const reviewsStatus = useSelector((state) => state.reviews.status[propertyId]);
    const reviewsError = useSelector((state) => state.reviews.error[propertyId]);
    const landlordStatsMap = useSelector((state) => state.reviews.landlordStats || {});
    const landlordStatsStatusMap = useSelector(
        (state) => state.reviews.landlordStatsStatus || {}
    );
    const isReviewsLoading = reviewsStatus === "loading";
    const propertyReviews = reviewsData.items || [];
    const displayedReviews = propertyReviews.slice(0, visibleReviewCount);
    const hasMoreReviews = propertyReviews.length > visibleReviewCount;
    const canCollapse = visibleReviewCount > 3;
    const rawReplyMutation = useSelector((state) => state.reviews?.mutations?.reply);
    const replyMutation = rawReplyMutation || { status: "idle", error: null };
    const isReplySubmitting = replyMutation.status === "loading";
    const MAX_COMMENT_LENGTH = 160;
    const landlordIdentifier =
        property?.landlord?.landlordId ||
        property?.landlord?.userId ||
        property?.landlordId ||
        property?.landlord?.id ||
        property?.landlord?.landlordID ||
        property?.landlord?.uuid ||
        null;

    const scrollViewRef = useRef(null);
    const bookingSectionYRef = useRef(null);
    const reviewsSectionYRef = useRef(null);
    const [bookingSelection, setBookingSelection] = useState({
        startDate: null,
        endDate: null,
        nights: 0,
    });
    const currentUserId =
        currentUser?.userId !== undefined && currentUser?.userId !== null
            ? String(currentUser.userId)
            : null;
    const currentTenantId =
        currentUser?.tenant?.tenantId || currentUser?.tenantId || null;
    const normalizedCurrentTenantId =
        currentTenantId !== undefined && currentTenantId !== null
            ? String(currentTenantId)
            : null;
            const landlordStats =
        landlordStatsMap[landlordIdentifier] || {
            totalReviews: 0,
            averageRating: 0,
        };
    const landlordStatsStatus = landlordIdentifier
        ? landlordStatsStatusMap[landlordIdentifier] || "idle"
        : "idle";
    const isCurrentPropertyLandlord =
        isLandlord &&
        property?.landlord?.userId !== undefined &&
        property?.landlord?.userId !== null &&
        currentUser?.userId !== undefined &&
        currentUser?.userId !== null &&
        String(property.landlord.userId) === String(currentUser.userId);
    const lastReplySubmittedIdRef = useRef(null);


    const mapRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(15);

    const zoomIn = () => {
        const newZoom = Math.min(zoomLevel + 1, 20);
        setZoomLevel(newZoom);
        const newRegion = {
            latitude: latitude || DEFAULT_MAP_REGION.latitude,
            longitude: longitude || DEFAULT_MAP_REGION.longitude,
            latitudeDelta: mapRegion.latitudeDelta / 2, // Zoom in by halving delta
            longitudeDelta: mapRegion.longitudeDelta / 2,
        };
        console.log("Zooming in to:", newRegion);
        mapRef.current?.animateToRegion(newRegion, 300);
    };

    const zoomOut = () => {
        const newZoom = Math.max(zoomLevel - 1, 1);
        setZoomLevel(newZoom);
        const newRegion = {
            latitude: latitude || DEFAULT_MAP_REGION.latitude,
            longitude: longitude || DEFAULT_MAP_REGION.longitude,
            latitudeDelta: mapRegion.latitudeDelta * 2, // Zoom out by doubling delta
            longitudeDelta: mapRegion.longitudeDelta * 2,
        };
        console.log("Zooming out to:", newRegion);
        mapRef.current?.animateToRegion(newRegion, 300);
    };


    const handleBookingSectionLayout = (event) => {
        bookingSectionYRef.current = event?.nativeEvent?.layout?.y ?? 0;
    };

    const handleScrollToBooking = () => {
        const y = bookingSectionYRef.current ?? 0;
        scrollViewRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    };

    const handleReviewsSectionLayout = (event) => {
        reviewsSectionYRef.current = event?.nativeEvent?.layout?.y ?? 0;
    };

    const handleScrollToReviews = useCallback(() => {
        const y = reviewsSectionYRef.current ?? 0;
        scrollViewRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    }, []);

    const handleBookingSelectionChange = useCallback(({ startDate, endDate, nights }) => {
        setBookingSelection({
            startDate: startDate || null,
            endDate: endDate || null,
            nights: nights || 0,
        });
    }, []);

    const isMyReview = useCallback(
        (review) => {
            if (!review) {
                return false;
            }

            const reviewUserId =
                review?.tenant?.userId ||
                review?.booking?.tenant?.userId ||
                review?.userId ||
                null;
            const reviewTenantId =
                review?.tenant?.tenantId ||
                review?.booking?.tenant?.tenantId ||
                review?.tenantId ||
                review?.booking?.tenantId ||
                null;

            if (
                reviewUserId &&
                currentUserId &&
                String(reviewUserId) === String(currentUserId)
            ) {
                return true;
            }

            if (
                reviewTenantId &&
                normalizedCurrentTenantId &&
                String(reviewTenantId) === String(normalizedCurrentTenantId)
            ) {
                return true;
            }

            return false;
        },
        [currentUserId, normalizedCurrentTenantId]
    );

    const handleShowMoreReviews = useCallback(() => {
        setVisibleReviewCount((prev) =>
            Math.min(propertyReviews.length, prev + 3)
        );
    }, [propertyReviews.length]);

    const handleCollapseReviews = useCallback(() => {
        setVisibleReviewCount(3);
    }, []);

    const handleToggleReviewMenu = useCallback((reviewKey) => {
        setReviewMenuVisibleId((prev) => (prev === reviewKey ? null : reviewKey));
    }, []);
    const extractReviewReply = useCallback((review) => {
        if (!review || typeof review !== "object") {
            return null;
        }

        if (review.reply && typeof review.reply === "object") {
            return review.reply;
        }
        if (review.reviewReply && typeof review.reviewReply === "object") {
            return review.reviewReply;
        }
        if (review.landlordReply && typeof review.landlordReply === "object") {
            return review.landlordReply;
        }
        if (review.replyText !== undefined && review.replyText !== null) {
            return {
                replyId:
                    review.replyId ||
                    review.reviewReplyId ||
                    review.replyID ||
                    null,
                replyText:
                    typeof review.replyText === "string"
                        ? review.replyText
                        : String(review.replyText),
                createdAt: review.replyCreatedAt || null,
                updatedAt: review.replyUpdatedAt || null,
            };
        }

        return null;
    }, []);

    const getReviewReplyText = useCallback(
        (review) => {
            const reply = extractReviewReply(review);
            if (reply) {
                const raw =
                    reply.replyText ??
                    reply.text ??
                    reply.content ??
                    reply.message ??
                    reply.comment;
                if (raw !== undefined && raw !== null) {
                    return typeof raw === "string" ? raw : String(raw);
                }
            }
            if (review && review.replyText !== undefined && review.replyText !== null) {
                return typeof review.replyText === "string"
                    ? review.replyText
                    : String(review.replyText);
            }
            return "";
        },
        [extractReviewReply]
    );

    const handleStartReply = useCallback(
        (review) => {
            if (!review) {
                return;
            }
            const identifier =
                review?.reviewId ??
                review?.id ??
                review?.reviewID ??
                review?.idReview ??
                null;
            if (identifier === null || identifier === undefined) {
                showToast(
                    "error",
                    "top",
                    "Không thể phản hồi",
                    "Không tìm thấy mã đánh giá"
                );
                return;
            }
            const existingReply = extractReviewReply(review);
            const initialValue = existingReply
                ? existingReply.replyText ??
                existingReply.text ??
                existingReply.content ??
                existingReply.message ??
                ""
                : review?.replyText ?? "";

            setActiveReplyReviewId(String(identifier));
            setReplyInputValue(
                typeof initialValue === "string" ? initialValue : String(initialValue || "")
            );
            setReplyInputError("");
            setReviewMenuVisibleId(null);
        },
        [extractReviewReply]
    );

    const handleCancelReply = useCallback(() => {
        setActiveReplyReviewId(null);
        setReplyInputValue("");
        setReplyInputError("");
        lastReplySubmittedIdRef.current = null;
    }, []);

    const handleSubmitReply = useCallback(
        (review) => {
            if (!review) {
                return;
            }

            const identifier =
                review?.reviewId ??
                review?.id ??
                review?.reviewID ??
                review?.idReview ??
                null;

            if (identifier === null || identifier === undefined) {
                showToast(
                    "error",
                    "top",
                    "Không thể phản hồi",
                    "Không tìm thấy mã đánh giá để phản hồi"
                );
                return;
            }

            const text = replyInputValue.trim();
            if (!text) {
                setReplyInputError("Vui lòng nhập nội dung phản hồi");
                return;
            }

            if (isReplySubmitting) {
                return;
            }

            const existingReply = extractReviewReply(review);
            const resolvedReplyId = existingReply
                ? existingReply.replyId || existingReply.id || existingReply.replyID || null
                : null;

            lastReplySubmittedIdRef.current = String(identifier);
            dispatch(
                submitReviewReplyThunk(
                    resolvedReplyId
                        ? { replyId: resolvedReplyId, reviewId: identifier, replyText: text }
                        : { reviewId: identifier, replyText: text }
                )
            );
        },
        [dispatch, extractReviewReply, isReplySubmitting, replyInputValue]
    );

    const handleStartUpdateReview = useCallback((review) => {
        if (!review) {
            return;
        }
        setSelectedReview(review);
        setReviewRating(review?.rating ? Number(review.rating) : 0);
        setReviewComment(review?.comment || "");
        setReviewError("");
        setReviewMenuVisibleId(null);
        setReviewModalVisible(true);
    }, []);

    const handleCloseReviewModal = useCallback(() => {
        setReviewModalVisible(false);
        setSelectedReview(null);
        setReviewRating(0);
        setReviewComment("");
        setReviewError("");
    }, []);

    const handleSubmitReviewUpdate = useCallback(async () => {
        if (!selectedReview?.reviewId) {
            setReviewError("Không tìm thấy mã đánh giá");
            return;
        }
        if (!reviewRating) {
            setReviewError("Vui lòng chọn số sao trước khi gửi");
            return;
        }

        const reviewId = selectedReview.reviewId;
        const bookingId =
            selectedReview?.booking?.bookingId ||
            selectedReview?.bookingId ||
            null;
        setReviewSubmitting(true);
        try {
            await dispatch(
                updateReviewThunk({
                    reviewId,
                    bookingId,
                    propertyId,
                    rating: reviewRating,
                    comment: reviewComment,
                })
            ).unwrap();
            Alert.alert("Thành công", "Cập nhật đánh giá thành công");
            handleCloseReviewModal();
            dispatch(fetchPropertyReviewsSummary(propertyId));
            setHighlightedReviewId(reviewId);
            setTimeout(() => {
                handleScrollToReviews();
            }, 250);
        } catch (error) {
            const message =
                (typeof error === "string" && error) ||
                error?.message ||
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Không thể cập nhật đánh giá. Vui lòng thử lại.";
            setReviewError(
                typeof message === "string"
                    ? message
                    : "Không thể cập nhật đánh giá. Vui lòng thử lại."
            );
        } finally {
            setReviewSubmitting(false);
        }
    }, [
        selectedReview,
        reviewRating,
        reviewComment,
        dispatch,
        propertyId,
        handleCloseReviewModal,
        handleScrollToReviews,
    ]);

    useEffect(() => {
        if (!lastReplySubmittedIdRef.current) {
            return;
        }

        if (replyMutation.status === "succeeded") {
            if (activeReplyReviewId === lastReplySubmittedIdRef.current) {
                setActiveReplyReviewId(null);
                setReplyInputValue("");
                setReplyInputError("");
            }
            lastReplySubmittedIdRef.current = null;
        } else if (replyMutation.status === "failed") {
            const resolveErrorMessage = (value) => {
                if (!value) {
                    return "Không thể gửi phản hồi";
                }
                if (typeof value === "string") {
                    return value;
                }
                if (typeof value === "object") {
                    if (typeof value.message === "string") {
                        return value.message;
                    }
                    if (typeof value.error === "string") {
                        return value.error;
                    }
                    if (typeof value.detail === "string") {
                        return value.detail;
                    }
                }
                return "Không thể gửi phản hồi";
            };

            const message = resolveErrorMessage(replyMutation.error);

            if (activeReplyReviewId === lastReplySubmittedIdRef.current) {
                setReplyInputError(message);
            }

            showToast("error", "top", "Không thể gửi phản hồi", message);
            lastReplySubmittedIdRef.current = null;
        }
    }, [replyMutation.status, replyMutation.error, activeReplyReviewId]);

    const handleDeleteReview = useCallback(
        (review) => {
            if (!review?.reviewId) {
                return;
            }

            const bookingId =
                review?.booking?.bookingId || review?.bookingId || null;

            Alert.alert(
                "Xóa đánh giá",
                "Bạn có chắc chắn muốn xóa đánh giá này?",
                [
                    { text: "Hủy", style: "cancel" },
                    {
                        text: "Xóa",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await dispatch(
                                    deleteReviewThunk({
                                        reviewId: review.reviewId,
                                        propertyId,
                                        bookingId,
                                    })
                                ).unwrap();
                                Alert.alert("Thành công", "Đã xóa đánh giá");
                                dispatch(fetchPropertyReviewsSummary(propertyId));
                                setReviewMenuVisibleId(null);
                                setHighlightedReviewId(null);
                            } catch (error) {
                                const message =
                                    (typeof error === "string" && error) ||
                                    error?.message ||
                                    error?.response?.data?.message ||
                                    error?.response?.data?.error ||
                                    "Không thể xóa đánh giá. Vui lòng thử lại.";
                                Alert.alert(
                                    "Lỗi",
                                    typeof message === "string"
                                        ? message
                                        : "Không thể xóa đánh giá. Vui lòng thử lại."
                                );
                            }
                        },
                    },
                ]
            );
        },
        [dispatch, propertyId]
    );

    const handleOpenSimilarProperty = useCallback(
        (targetPropertyId, position) => {
            if (!targetPropertyId) {
                return;
            }

            const metadata = { source: "similar_properties" };
            if (typeof position === "number") {
                metadata.position = position;
            }

            dispatch(
                recordUserEvent({
                    eventType: "VIEW",
                    roomId: targetPropertyId,
                    metadata,
                })
            );

            navigation.push("PropertyDetail", {
                propertyId: targetPropertyId,
                loggedViewEvent: true,
            });
        },
        [dispatch, navigation]
    );

    useEffect(() => {
        setExpandedReviews({});
        setVisibleReviewCount(3);
        setReviewMenuVisibleId(null);
        setHighlightedReviewId(highlightReviewIdParam || null);
    }, [propertyId, highlightReviewIdParam]);

    useEffect(() => {
        if (scrollToReviewsParam && !isReviewsLoading) {
            const timeout = setTimeout(() => {
                handleScrollToReviews();
            }, 250);
            return () => clearTimeout(timeout);
        }
    }, [scrollToReviewsParam, isReviewsLoading, handleScrollToReviews]);

    useEffect(() => {
        let targetIndex = -1;
        if (highlightReviewIdParam) {
            targetIndex = propertyReviews.findIndex(
                (review) => review?.reviewId === highlightReviewIdParam
            );
        }
        if (targetIndex === -1) {
            targetIndex = propertyReviews.findIndex((review) => isMyReview(review));
        }

        if (targetIndex !== -1) {
            setVisibleReviewCount((prev) =>
                targetIndex + 1 > prev ? targetIndex + 1 : prev
            );
        }
    }, [propertyReviews, highlightReviewIdParam, isMyReview]);

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
        if (!propertyId) {
            return;
        }

        dispatch(fetchSimilarRecommendations({ roomId: propertyId }));

        return () => {
            dispatch(clearSimilarRecommendations());
        };
    }, [dispatch, propertyId]);

    useEffect(() => {
        if (!property?.propertyId || loggedViewEvent) {
            return;
        }

        dispatch(
            recordUserEvent({
                eventType: "VIEW",
                roomId: property.propertyId,
                metadata: { screen: "property_detail" },
            })
        );
    }, [dispatch, loggedViewEvent, property?.propertyId]);

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

    useEffect(() => {
        if (!landlordIdentifier) {
            return;
        }

        dispatch(fetchLandlordReviewStats(landlordIdentifier));

        return () => {
            dispatch(resetLandlordStats(landlordIdentifier));
        };
    }, [dispatch, landlordIdentifier]);

    const locationAddress = property?.address || {};
    const latitude = parseCoordinate(locationAddress.latitude);
    const longitude = parseCoordinate(locationAddress.longitude);
    const hasValidCoordinate =
        typeof latitude === "number" && typeof longitude === "number";

    const locationAddressText =
        locationAddress.addressFull ||
        [
            locationAddress.houseNumber,
            locationAddress.street,
            locationAddress.wardName,
            locationAddress.districtName,
            locationAddress.provinceName,
        ]
            .filter(Boolean)
            .join(", ");

    const mapRegion = {
        latitude: hasValidCoordinate ? latitude : DEFAULT_MAP_REGION.latitude,
        longitude: hasValidCoordinate ? longitude : DEFAULT_MAP_REGION.longitude,
        latitudeDelta: DEFAULT_MAP_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_MAP_REGION.longitudeDelta,
    };

    const landlordAvatarKey = property?.landlord?.avatarUrl || null;
    const landlordAvatarUrl = landlordAvatarKey
        ? resolveAssetUrl(landlordAvatarKey)
        : null;
    const landlordFullName =
        property?.landlord?.fullName || property?.landlord?.name || "Ẩn danh";
    const landlordPhoneNumber = property?.landlord?.phoneNumber || null;
    const landlordFollowerCount =
        property?.landlord?.followersCount ??
        property?.landlord?.followerCount ??
        128;
    const landlordTotalReviewsLabel =
        landlordStatsStatus === "loading"
            ? "Đang tải..."
            : landlordStatsStatus === "failed"
                ? "Không có dữ liệu"
                : `${landlordStats.totalReviews} lượt đánh giá`;
    const landlordAverageRatingValue =
        landlordStats.totalReviews > 0 && typeof landlordStats.averageRating === "number"
            ? Number.parseFloat(landlordStats.averageRating || 0).toFixed(1)
            : null;
    const landlordAverageLabel =
        landlordStatsStatus === "loading"
            ? "Đang tải..."
            : landlordStatsStatus === "failed"
                ? "Không có dữ liệu"
                : landlordAverageRatingValue !== null
                    ? `${landlordAverageRatingValue}/5 trung bình`
                    : "Chưa có đánh giá";
    const handleOpenLandlordProfile = useCallback(() => {
        if (!landlordIdentifier) {
            return;
        }

        navigation.navigate("LandlordProperties", {
            landlordId: landlordIdentifier,
            landlord: {
                fullName: landlordFullName,
                name: landlordFullName,
                avatarUrl: landlordAvatarKey,
                phoneNumber: landlordPhoneNumber,
            },
            stats: {
                totalReviews: landlordStats.totalReviews || 0,
                averageRating: landlordStats.averageRating || 0,
            },
            followerCount: landlordFollowerCount,
        });
    }, [
        landlordIdentifier,
        navigation,
        landlordFullName,
        landlordAvatarKey,
        landlordPhoneNumber,
        landlordStats.totalReviews,
        landlordStats.averageRating,
        landlordFollowerCount,
    ]);

    if (loading || (!property && !error)) {
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
    const propertyDisplayName =
        property?.propertyName ||
        property?.name ||
        property?.roomName ||
        property?.buildingName ||
        null;
    const ratingAverage =
        reviewsSummary.total > 0
            ? Number.parseFloat(reviewsSummary.average || 0)
            : null;
    const normalizedRatingAverage =
        typeof ratingAverage === "number" && !Number.isNaN(ratingAverage)
            ? ratingAverage
            : null;
    const ratingStatus =
        normalizedRatingAverage !== null
            ? getRatingStatus(normalizedRatingAverage)
            : null;
    const ratingBadgeLabel = ratingStatus ? ratingStatus.label : "Chưa có đánh giá";
    const ratingDisplayValue =
        normalizedRatingAverage !== null
            ? normalizedRatingAverage.toFixed(1)
            : "--";
    const formatPriceWithUnit = (property) => {
        if (!property?.price) return "Giá liên hệ";
        const formatted = Number(property.price).toLocaleString("vi-VN");
        return property.propertyType === "ROOM"
            ? `${formatted} đ/tháng`
            : `${formatted} đ/ngày`;
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

    function getRatingStatus(average) {
        if (typeof average !== "number" || Number.isNaN(average)) {
            return null;
        }

        if (average >= 4.8) {
            return {
                label: "Được khách yêu thích",
                backgroundColor: "#fff7ed",
                textColor: "#c2410c",
                icon: "crown",
                iconColor: "#f97316",
                borderColor: "#fed7aa",
            };
        }

        if (average >= 4.5) {
            return {
                label: "Rất tốt",
                backgroundColor: "#fefce8",
                textColor: "#854d0e",
                icon: "star-circle-outline",
                iconColor: "#eab308",
                borderColor: "#fde68a",
            };
        }

        if (average >= 4.0) {
            return {
                label: "Tốt",
                backgroundColor: "#ecfdf5",
                textColor: "#047857",
                icon: "check-circle-outline",
                iconColor: "#10b981",
                borderColor: "#bbf7d0",
            };
        }

        if (average >= 3.0) {
            return {
                label: "Trung bình",
                backgroundColor: "#f4f4f5",
                textColor: "#4b5563",
                icon: "information-outline",
                iconColor: "#6b7280",
                borderColor: "#d4d4d8",
            };
        }

        return {
            label: "Cần cải thiện",
            backgroundColor: "#fef2f2",
            textColor: "#b91c1c",
            icon: "alert-circle-outline",
            iconColor: "#ef4444",
            borderColor: "#fecaca",
        };
    }

    const renderFurnishingSubtitle = (furnishing) => {
        if (furnishing.quantity && furnishing.quantity >= 1) {
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

    const getCancellationDeadlineLabel = (startDateKey) => {
        if (!startDateKey) {
            return null;
        }

        const checkInDate = new Date(`${startDateKey}T00:00:00`);
        if (Number.isNaN(checkInDate.getTime())) {
            return null;
        }

        const deadline = new Date(checkInDate);
        deadline.setDate(deadline.getDate() - 1);

        const day = deadline.getDate();
        const month = deadline.getMonth() + 1;
        return `ngày ${day} thg ${month}`;
    };

    const cancellationDeadlineLabel = getCancellationDeadlineLabel(
        bookingSelection.startDate
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
                onScrollBeginDrag={() => setReviewMenuVisibleId(null)}
            >
                {/* Media gallery */}
                <View style={styles.mediaContainer}>
                    {/* Main Media Viewer */}
                    {mediaList.length > 0 ? (
                        mediaList[selectedMediaIndex].mediaType === "VIDEO" ? (
                            <Video
                                source={{ uri: mediaList[selectedMediaIndex].fullUrl }}
                                style={styles.mainImage}
                                useNativeControls
                                resizeMode="cover"
                                posterSource={
                                    mediaList[selectedMediaIndex].poster
                                        ? { uri: mediaList[selectedMediaIndex].poster }
                                        : null
                                }
                                posterStyle={styles.mainImage}
                                onError={(e) => console.warn("VIDEO ERROR:", e)}
                            />
                        ) : (
                            <S3Image
                                src={mediaList[selectedMediaIndex].fullUrl}
                                style={styles.mainImage}
                                alt={mediaList[selectedMediaIndex].mediaId || `media-${selectedMediaIndex}`}
                            />
                        )
                    ) : (
                        <S3Image
                            src="https://picsum.photos/600/400"
                            style={styles.mainImage}
                            alt="placeholder"
                        />
                    )}

                    {/* Thumbnail Selector */}
                    {mediaList.length > 1 && (
                        <FlatList
                            horizontal
                            data={mediaList}
                            keyExtractor={(item, index) =>
                                item.mediaId || index.toString()
                            }
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.thumbnailWrapper,
                                        selectedMediaIndex === index && styles.thumbnailSelected,
                                    ]}
                                    onPress={() => setSelectedMediaIndex(index)}
                                >
                                    {item.mediaType === "VIDEO" ? (
                                        <Video
                                            source={{ uri: item.fullUrl }}
                                            style={styles.thumbnail}
                                            usePoster
                                            posterSource={
                                                item.poster ? { uri: item.poster } : null
                                            }
                                            posterStyle={styles.thumbnail}
                                            isMuted
                                            shouldPlay={false}
                                            onError={(e) => console.warn("THUMBNAIL VIDEO ERROR:", e)}
                                        />
                                    ) : (
                                        <S3Image
                                            src={item.fullUrl}
                                            style={styles.thumbnail}
                                            alt={item.mediaId || `thumbnail-${index}`}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbnailList}
                            contentContainerStyle={styles.thumbnailListContent}
                        />
                    )}
                </View>

                {/* Tiêu đề + Giá */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryInlineRow}>
                        <View style={styles.summaryInlineItem}>
                            <View style={styles.summaryInlineTextContainer}>
                                <Text style={styles.summaryInlineLabel}>Tiêu đề:</Text>
                                <Text style={styles.summaryInlineTitle}>
                                    {property.title || "Phòng cho thuê"}
                                </Text>
                            </View>
                        </View>

                        {propertyDisplayName ? (
                            <View style={styles.summaryInlineItem}>
                                <Icon
                                    name="office-building-outline"
                                    size={20}
                                    color="#0ea5e9"
                                    style={styles.summaryInlineIcon}
                                />
                                <View style={styles.summaryInlineTextContainer}>
                                    <Text style={styles.summaryInlineLabel}>Tên căn hộ:</Text>
                                    <Text style={styles.summaryInlineText}>
                                        {propertyDisplayName}
                                    </Text>
                                </View>
                            </View>
                            ) : null}

                    <View style={styles.summaryInlineItem}>
                            <Ionicons
                                name="pricetag-outline"
                                size={18}
                                color="#f97316"
                                style={styles.summaryInlineIcon}
                            />
                            <View style={styles.summaryInlineTextContainer}>
                                <Text style={styles.summaryInlineLabel}>Giá:</Text>
                                <Text style={styles.price}>{formatPriceWithUnit(property)}</Text>
                            </View>
                        </View>

                        <View style={[styles.summaryInlineItem, styles.summaryInlineAddress]}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color="#2563eb"
                                style={styles.summaryInlineIcon}
                            />
                            <View style={styles.summaryInlineTextContainer}>
                                <Text style={styles.summaryInlineLabel}>Địa chỉ:</Text>
                                <Text style={styles.summaryInlineText}>
                                    {addressFormatted}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.ratingBadgeRow}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.ratingBadge, styles.ratingBadgeNumber]}
                            onPress={handleScrollToReviews}
                        >
                            <Ionicons name="star" size={16} color="#f59e0b" />
                            <Text
                                style={[styles.ratingBadgeText, styles.ratingBadgeNumberText]}
                            >
                                {isReviewsLoading
                                    ? "Đang tải"
                                    : reviewsStatus === "failed"
                                        ? "Không thể tải"
                                        : ratingDisplayValue}
                            </Text>
                        </TouchableOpacity>
                        <View
                            style={[
                                styles.ratingBadge,
                                styles.ratingStatusBadge,
                                ratingStatus
                                    ? {
                                          backgroundColor: ratingStatus.backgroundColor,
                                          borderColor: ratingStatus.borderColor,
                                      }
                                    : styles.ratingStatusBadgeEmpty,
                            ]}
                        >
                            <Icon
                                name={ratingStatus?.icon || "star-outline"}
                                size={18}
                                color={ratingStatus?.iconColor || "#6b7280"}
                            />
                            <Text
                                style={[
                                    styles.ratingBadgeText,
                                    { color: ratingStatus?.textColor || "#374151" },
                                ]}
                            >
                                {ratingStatus ? ratingBadgeLabel : "Chưa có đánh giá"}
                            </Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.ratingBadge, styles.ratingBadgeNeutral]}
                            onPress={handleScrollToReviews}
                        >
                            <Icon
                                name="comment-text-multiple-outline"
                                size={18}
                                color="#2563eb"
                            />
                            <Text style={styles.ratingBadgeText}>
                                {isReviewsLoading
                                    ? "-- đánh giá"
                                    : reviewsStatus === "failed"
                                        ? "Lỗi"
                                        : `${reviewsSummary.total || 0} đánh giá`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="account-group" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.capacity ? `${property.capacity} khách` : "Số khách đang cập nhật"}
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
                                {property.floorNo ? `Tầng ${property.floorNo}` : "Tầng đang cập nhật"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="ruler-square" size={18} color="#555" />
                            <Text style={styles.metaText}>
                                {property.area ? `${property.area} m²` : "Chưa rõ diện tích"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                {/* Mô tả */}
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <Text style={styles.description}>
                    {property.description || "Chưa có mô tả chi tiết"}
                </Text>

                <View style={styles.sectionDivider} />

                {property.furnishings?.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Nội thất & tiện nghi</Text>
                        <View style={styles.infoList}>
                            {property.furnishings.map((furnishing, idx) => (
                                <View
                                    key={furnishing.id || `${furnishing.furnishingId || idx}`}
                                    style={[
                                        styles.infoCard,
                                        styles.infoCardTwoColumn,
                                        idx % 2 === 0
                                            ? styles.infoCardTwoColumnLeft
                                            : styles.infoCardTwoColumnRight,
                                    ]}
                                >
                                    <View style={styles.infoIconWrapper}>
                                        <Icon
                                            name={getFurnishingIconName(furnishing.furnishingName || "")}
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

                    {property.services?.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Dịch vụ đi kèm</Text>
                        <View style={styles.infoList}>
                            {property.services.map((service, idx) => (
                                <View
                                    key={service.id || `${service.serviceName || idx}`}
                                    style={[
                                        styles.infoCard,
                                        styles.infoCardTwoColumn,
                                        idx % 2 === 0
                                            ? styles.infoCardTwoColumnLeft
                                            : styles.infoCardTwoColumnRight,
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

                <View style={styles.sectionDivider} />

                <View style={styles.locationContainer}>
                    <Text style={styles.sectionTitle}>Nơi bạn sẽ đến</Text>
                    {locationAddressText ? (
                        <Text style={styles.locationAddressText}>
                            {locationAddressText}
                        </Text>
                    ) : null}
                </View>

                {Platform.OS !== "web" && (
                    <View style={styles.mapWrapper}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={Platform.OS === "android" ? "google" : undefined}
                            initialRegion={mapRegion}
                            onMapReady={() => console.log("Map is ready")}
                        >
                            {hasValidCoordinate && (
                                <Marker
                                    coordinate={{ latitude, longitude }}
                                    title={property.title || "Vị trí"}
                                    description={locationAddressText || undefined}
                                />
                            )}
                        </MapView>

                        {/* Nút phóng to / thu nhỏ */}
                        <View style={styles.zoomControls}>
                            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
                                <Text style={styles.zoomText}>+</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
                                <Text style={styles.zoomText}>-</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}


                <View style={styles.sectionDivider} />

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
                <View style={styles.sectionDivider} />
                <View onLayout={handleReviewsSectionLayout}>
                    <Text style={styles.sectionTitle}>Đánh giá</Text>
                    {isReviewsLoading ? (
                        <Text style={styles.reviewsStatusText}>Đang tải đánh giá...</Text>
                    ) : reviewsStatus === "failed" ? (
                        <Text style={[styles.reviewsStatusText, { color: "#d9534f" }]}>
                            {reviewsError || "Không thể tải đánh giá"}
                        </Text>
                    ) : propertyReviews.length > 0 ? (
                        <>
                            <View style={styles.reviewsContainer}>
                                {displayedReviews.map((review, index) => {
                                    const reviewKey = review.reviewId || `${propertyId}-${index}`;
                                    const isExpanded = !!expandedReviews[reviewKey];
                                    const comment = getDisplayedComment(review.comment, isExpanded);
                                    const showToggle = shouldTruncateComment(review.comment);
                                    const mine = isMyReview(review);
                                    const isHighlighted =
                                        mine ||
                                        (highlightedReviewId &&
                                            review.reviewId &&
                                            review.reviewId === highlightedReviewId);
                                    const menuVisible = reviewMenuVisibleId === reviewKey;

                                    const reviewIdString =
                                        review?.reviewId !== undefined && review?.reviewId !== null
                                            ? String(review.reviewId)
                                            : review?.id !== undefined && review?.id !== null
                                                ? String(review.id)
                                                : review?.reviewID !== undefined && review?.reviewID !== null
                                                    ? String(review.reviewID)
                                                    : review?.idReview !== undefined && review?.idReview !== null
                                                        ? String(review.idReview)
                                                        : null;
                                    const reviewReplyText = getReviewReplyText(review);
                                    const trimmedReplyText =
                                        typeof reviewReplyText === "string"
                                            ? reviewReplyText.trim()
                                            : "";
                                    const isReplyEditing =
                                        reviewIdString &&
                                        activeReplyReviewId === reviewIdString;
                                    const shouldRenderReplySection =
                                        (trimmedReplyText && trimmedReplyText.length > 0) ||
                                        (isCurrentPropertyLandlord && !!reviewIdString);

                                    return (
                                        <TouchableWithoutFeedback
                                            key={reviewKey}
                                            onPress={() => setReviewMenuVisibleId(null)}
                                        >
                                            <View
                                                style={[
                                                    styles.reviewCard,
                                                    index !== displayedReviews.length - 1 &&
                                                    styles.reviewCardSpacing,
                                                    isHighlighted && styles.reviewCardHighlight,
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
                                                    {mine && (
                                                        <TouchableOpacity
                                                            style={styles.reviewMenuTrigger}
                                                            onPress={() => handleToggleReviewMenu(reviewKey)}
                                                        >
                                                            <Ionicons
                                                                name="ellipsis-horizontal"
                                                                size={18}
                                                                color="#6b7280"
                                                            />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                {comment ? (
                                                    <View style={styles.reviewBody}>
                                                        <Text style={styles.reviewComment}>{comment}</Text>
                                                        {showToggle && (
                                                            <TouchableOpacity
                                                                onPress={() => toggleReviewExpansion(reviewKey)}
                                                            >
                                                                <Text style={styles.reviewToggle}>
                                                                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                ) : null}
                                                {shouldRenderReplySection ? (
                                                    <View
                                                        style={[
                                                            styles.reviewReplySection,
                                                            comment
                                                                ? styles.reviewReplySectionWithComment
                                                                : null,
                                                        ]}
                                                    >
                                                        {trimmedReplyText ? (
                                                            <View style={styles.reviewReplyBubble}>
                                                                <Text style={styles.reviewReplyLabel}>
                                                                    Phản hồi của chủ nhà
                                                                </Text>
                                                                <Text style={styles.reviewReplyText}>
                                                                    {trimmedReplyText}
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                        {isCurrentPropertyLandlord && reviewIdString ? (
                                                            isReplyEditing ? (
                                                                <>
                                                                    <TextInput
                                                                        style={[
                                                                            styles.reviewReplyInput,
                                                                            replyInputError
                                                                                ? styles.reviewReplyInputError
                                                                                : null,
                                                                        ]}
                                                                        value={replyInputValue}
                                                                        onChangeText={(value) => {
                                                                            setReplyInputValue(value);
                                                                            if (replyInputError) {
                                                                                setReplyInputError("");
                                                                            }
                                                                        }}
                                                                        placeholder="Nhập phản hồi của bạn..."
                                                                        placeholderTextColor="#9ca3af"
                                                                        multiline
                                                                        textAlignVertical="top"
                                                                        editable={!isReplySubmitting}
                                                                    />
                                                                    {replyInputError ? (
                                                                        <Text style={styles.reviewReplyErrorText}>
                                                                            {replyInputError}
                                                                        </Text>
                                                                    ) : null}
                                                                    <View style={styles.reviewReplyActions}>
                                                                        <TouchableOpacity
                                                                            style={[
                                                                                styles.reviewReplySubmitButton,
                                                                                isReplySubmitting &&
                                                                                styles.reviewReplySubmitButtonDisabled,
                                                                            ]}
                                                                            onPress={() => handleSubmitReply(review)}
                                                                            disabled={isReplySubmitting}
                                                                        >
                                                                            <Text style={styles.reviewReplySubmitText}>
                                                                                {isReplySubmitting
                                                                                    ? "Đang gửi..."
                                                                                    : trimmedReplyText
                                                                                        ? "Cập nhật phản hồi"
                                                                                        : "Gửi phản hồi"}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={styles.reviewReplyCancelButton}
                                                                            onPress={handleCancelReply}
                                                                            disabled={isReplySubmitting}
                                                                        >
                                                                            <Text style={styles.reviewReplyCancelText}>
                                                                                Huỷ
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </>
                                                            ) : (
                                                                <TouchableOpacity
                                                                    style={styles.reviewReplyButton}
                                                                    onPress={() => handleStartReply(review)}
                                                                >
                                                                    <Text style={styles.reviewReplyButtonText}>
                                                                        {trimmedReplyText
                                                                            ? "Cập nhật phản hồi"
                                                                            : "Phản hồi"}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )
                                                        ) : null}
                                                    </View>
                                                ) : null}
                                                {menuVisible && (
                                                    <View style={styles.reviewMenu}>
                                                        <TouchableOpacity
                                                            style={styles.reviewMenuOption}
                                                            onPress={() => handleStartUpdateReview(review)}
                                                        >
                                                            <Text style={styles.reviewMenuOptionText}>Cập nhật</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.reviewMenuOption,
                                                                styles.reviewMenuOptionDelete,
                                                            ]}
                                                            onPress={() => handleDeleteReview(review)}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.reviewMenuOptionText,
                                                                    styles.reviewMenuOptionDeleteText,
                                                                ]}
                                                            >
                                                                Xóa
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableWithoutFeedback>
                                    );
                                })}
                            </View>
                            {(hasMoreReviews || canCollapse) && (
                                <View style={styles.reviewsActionsRow}>
                                    {hasMoreReviews && (
                                        <TouchableOpacity
                                            style={styles.reviewsActionButton}
                                            onPress={handleShowMoreReviews}
                                        >
                                            <Text style={styles.reviewsActionText}>Hiển thị thêm đánh giá</Text>
                                        </TouchableOpacity>
                                    )}
                                    {canCollapse && (
                                        <TouchableOpacity
                                            style={[
                                                styles.reviewsActionButton,
                                                styles.reviewsActionButtonGhost,
                                            ]}
                                            onPress={handleCollapseReviews}
                                        >
                                            <Text style={styles.reviewsActionText}>Thu gọn đánh giá</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    ) : (
                        <Text style={styles.reviewsStatusText}>Chưa có đánh giá</Text>
                    )}
                </View>

                <View style={styles.sectionDivider} />

                <Text style={styles.sectionTitle}>Gặp gỡ chủ nhà của bạn</Text>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.landlordCard}
                    onPress={handleOpenLandlordProfile}
                    disabled={!landlordIdentifier}
                >
                    <View style={styles.landlordAvatarWrapper}>
                        {landlordAvatarUrl ? (
                            <S3Image src={landlordAvatarUrl} style={styles.landlordAvatar} />
                        ) : (
                            <Ionicons name="person" size={28} color="#f97316" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.landlordName} numberOfLines={1}>
                            {landlordFullName}
                        </Text>
                        {landlordPhoneNumber ? (
                            <TouchableOpacity
                                style={styles.landlordContactRow}
                                onPress={() => Linking.openURL(`tel:${landlordPhoneNumber}`)}
                            >
                                <Text style={styles.landlordContactText}>
                                    Gọi {landlordPhoneNumber}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        <View style={styles.landlordStatsRow}>
                            <View style={styles.landlordStatPill}>
                                <Ionicons name="people" size={16} color="#f97316" />
                                <Text style={styles.landlordStatText}>
                                    {landlordTotalReviewsLabel}
                                </Text>
                            </View>
                            <View style={styles.landlordStatPill}>
                                <Ionicons name="star" size={16} color="#f97316" />
                                <Text style={styles.landlordStatText}>
                                    {landlordAverageLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionDivider} />

                <Text style={styles.sectionTitle}>Chính sách hủy</Text>
                <Text style={styles.bodyText}>
                    {cancellationDeadlineLabel
                        ? `Bạn được hủy miễn phí trước ${cancellationDeadlineLabel} 14:00. Sau ${cancellationDeadlineLabel} 14:00, bạn không được hoàn tiền cho đặt phòng/đặt chỗ.`
                        : "Bạn được hủy miễn phí trước 14:00 ngày trước khi nhận phòng. Sau thời điểm này, bạn không được hoàn tiền cho đặt phòng/đặt chỗ."}
                </Text>

                <View style={styles.sectionDivider} />

                <Text style={styles.sectionTitle}>Nội quy nhà</Text>
                <View style={styles.rulesList}>
                    <Text style={styles.ruleItem}>• Nhận phòng sau 14:00PM</Text>
                    <Text style={styles.ruleItem}>• Trả phòng trước 11:00AM</Text>
                    <Text style={styles.ruleItem}>
                        • Trước khi rời đi: Tắt hết các thiết bị - Khóa cửa
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.similarSection}>
                    <Text style={styles.sectionTitle}>Có lẽ bạn sẽ thích</Text>
                    {similarError ? (
                        <Text style={styles.similarErrorText}>{similarError}</Text>
                    ) : similarLoading && similarRecommendations.length === 0 ? (
                        <View style={styles.similarLoadingWrapper}>
                            <ActivityIndicator size="small" color="#f97316" />
                        </View>
                    ) : similarRecommendations.length === 0 ? (
                        <Text style={styles.similarEmptyText}>
                            Không có gợi ý tương tự.
                        </Text>
                    ) : (
                        <View style={styles.similarGrid}>
                            {similarRecommendations.map((item, index) => {
                                const displayTitle = resolvePropertyTitle(item);
                                const displayName = resolvePropertyName(item);

                                return (
                                    <TouchableOpacity
                                        key={`${item.propertyId || index}`}
                                        style={styles.similarCard}
                                        onPress={() =>
                                            handleOpenSimilarProperty(
                                                item.propertyId,
                                                index
                                            )
                                        }
                                        >
                                        <S3Image
                                            src={
                                                item.media?.[0]?.url ||
                                                "https://picsum.photos/600/400"
                                            }
                                            cacheKey={item.updatedAt}
                                            style={styles.similarCardImage}
                                            alt={displayTitle}
                                        />
                                        <View style={styles.similarCardBody}>
                                            <Text
                                                style={styles.similarCardTitle}
                                                numberOfLines={2}
                                            >
                                                {displayTitle}
                                            </Text>
                                        {displayName ? (
                                                <Text
                                                    style={styles.similarCardSubtitle}
                                                    numberOfLines={1}
                                                >
                                                    {displayName}
                                                </Text>
                                            ) : null}
                                            <Text
                                                style={styles.similarCardPrice}
                                                numberOfLines={1}
                                            >
                                                {formatPriceWithUnit(item)}
                                            </Text>
                                            {item.address?.addressFull ? (
                                                <View style={styles.similarAddressRow}>
                                                    <Ionicons
                                                        name="location-outline"
                                                        size={14}
                                                        color="#f97316"
                                                    />
                                                    <Text
                                                        style={styles.similarCardAddress}
                                                        numberOfLines={1}
                                                    >
                                                        {item.address.addressFull.replace(
                                                            /_/g,
                                                            " "
                                                        )}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                    {similarLoading && similarRecommendations.length > 0 ? (
                        <View style={styles.similarLoadingWrapper}>
                            <ActivityIndicator size="small" color="#f97316" />
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            <ReviewModal
                visible={reviewModalVisible}
                title="Cập nhật đánh giá"
                subtitle={property?.title ? `Cho ${property.title}` : undefined}
                rating={reviewRating}
                onRatingChange={(value) => {
                    setReviewRating(value);
                    if (reviewError) {
                        setReviewError("");
                    }
                }}
                comment={reviewComment}
                onCommentChange={(text) => {
                    setReviewComment(text);
                    if (reviewError) {
                        setReviewError("");
                    }
                }}
                submitting={reviewSubmitting}
                errorMessage={reviewError}
                onCancel={handleCloseReviewModal}
                onSubmit={handleSubmitReviewUpdate}
                submitLabel="Cập nhật"
            />

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
                                    dispatch(
                                        pushServerMessage({
                                            ...serverMessage,
                                            __currentUserId: currentUser?.userId,
                                        })
                                    );

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
                        <Text style={styles.lightBtnText}>Nhắn tin</Text>
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
    mediaContainer: {
        marginBottom: 12,
    },
    thumbnailList: {
        marginTop: 8,
        marginHorizontal: 12,
    },
    thumbnailListContent: {
        paddingHorizontal: 4,
    },
    thumbnailWrapper: {
        marginHorizontal: 4,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "transparent",
    },
    thumbnailSelected: {
        borderColor: "#f36031",
        opacity: 1,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 6,
        opacity: 0.7,
    },
    summaryCard: {
        padding: 12,
        alignItems: "flex-start",
    },

     summaryInlineRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        width: "100%",
    },

    summaryInlineItem: {
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "100%",
        flexShrink: 1,
        marginRight: 12,
        marginBottom: 12,
    },

    summaryInlineIcon: {
        marginRight: 6,
    },

    summaryInlineTextContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        flexWrap: "wrap",
    },

    summaryInlineLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#4b5563",
        marginRight: 4,
    },

    summaryInlineTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111",
        flexShrink: 1,
        textAlign: "center",
    },

    summaryInlineText: {
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "600",
        lflexShrink: 1,
    },

    summaryInlineAddress: {
        flexBasis: "100%",
        alignItems: "flex-start",
        marginRight: 0,
    },

    priceRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    priceRowHighlighted: {
        backgroundColor: "#fff7ed",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#fed7aa",
        marginLeft: 4,
    },

    price: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 8,
        color: "#f36031",
    },

    ratingBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 12,
        marginTop: 16,
    },

    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 6,
        marginVertical: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
    },

    ratingBadgeNumber: {
        backgroundColor: "#fff7ed",
        borderColor: "#fed7aa",
    },

    ratingBadgeNeutral: {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
    },

    ratingBadgeText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
        color: "#374151",
    },

    ratingBadgeNumberText: {
        color: "#c2410c",
    },

    ratingStatusBadge: {
        borderWidth: 1,
    },

    ratingStatusBadgeEmpty: {
        backgroundColor: "#f3f4f6",
        borderColor: "#e5e7eb",
    },

    metaRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 6,
        gap: 12,
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
        textAlign: "center"
    },

    locationContainer: {
        paddingHorizontal: 5,
    },
    locationAddressText: {
        fontSize: 14,
        color: "#4b5563",
        marginTop: 6,
        marginLeft: 10
    },
    sectionDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#909090ff",
        marginVertical: 10,
        marginHorizontal: 12,
    },
    mapContainer: {
        height: 300,
        width: "100%",
        marginTop: 15,
        marginHorizontal: 12,
        borderRadius: 12,
        overflow: "hidden",
    },
    mapWrapper: {
        height: 300,
        width: "100%",
        marginVertical: 10,
        borderRadius: 12,
        overflow: "hidden",
    },
    map: {
        flex: 1,
    },
    zoomControls: {
        position: "absolute",
        right: 10,
        bottom: 10,
        flexDirection: "column",
    },
    zoomButton: {
        backgroundColor: "#fff",
        borderRadius: 25,
        width: 40,
        height: 40,
        marginVertical: 4,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 2,
        elevation: 3,
    },
    zoomText: {
        fontSize: 22,
        color: "#f36031",
        fontWeight: "700",
    },

    subText: {
        fontSize: 14,
        color: "#555",
        marginVertical: 2,
        textAlign: "left",
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
        fontSize: 18,
        fontWeight: "600",
        marginTop: 14,
        marginBottom: 6,
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
    landlordCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 12,
        marginTop: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
    },
    landlordAvatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#fee2e2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    landlordAvatar: {
        width: "100%",
        height: "100%",
    },
    landlordName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    landlordContactRow: {
        marginTop: 6,
    },
    landlordContactText: {
        fontSize: 14,
        color: "#f36031",
        fontWeight: "600",
    },
    landlordStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
        gap: 12,
    },
    landlordStatPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#f97316",
    },
    landlordStatText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#f97316",
        marginLeft: 4,
    },
    bodyText: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    rulesList: {
        paddingHorizontal: 18,
        marginTop: 8,
        marginBottom: 18,
    },
    ruleItem: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        marginBottom: 6,
    },
    reviewCard: {
        backgroundColor: "#f7f7f7",
        borderRadius: 12,
        padding: 12,
        position: "relative",
    },
    reviewCardSpacing: {
        marginBottom: 12,
    },
    reviewCardHighlight: {
        borderWidth: 1,
        borderColor: "#f97316",
        backgroundColor: "#fff7ed",
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
    reviewReplySection: {
        marginTop: 12,
    },
    reviewReplySectionWithComment: {
        marginTop: 16,
    },
    reviewReplyBubble: {
        backgroundColor: "#f3f4f6",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    reviewReplyLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1f2937",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    reviewReplyText: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },
    reviewReplyButton: {
        marginTop: 12,
        alignSelf: "flex-start",
    },
    reviewReplyButtonText: {
        color: "#f97316",
        fontWeight: "600",
        fontSize: 14,
        textDecorationLine: "underline",
    },
    reviewReplyInput: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#1f2937",
        minHeight: 96,
    },
    reviewReplyInputError: {
        borderColor: "#dc2626",
    },
    reviewReplyErrorText: {
        color: "#dc2626",
        fontSize: 12,
        marginTop: 6,
    },
    reviewReplyActions: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
    },
    reviewReplySubmitButton: {
        backgroundColor: "#f97316",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 12,
    },
    reviewReplySubmitButtonDisabled: {
        opacity: 0.6,
    },
    reviewReplySubmitText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    reviewReplyCancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
    },
    reviewReplyCancelText: {
        color: "#1f2937",
        fontWeight: "600",
        fontSize: 14,
    },
    reviewMenuTrigger: {
        padding: 6,
        marginLeft: 8,
        borderRadius: 16,
    },
    reviewMenu: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        overflow: "hidden",
        zIndex: 20,
    },
    reviewMenuOption: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#fff",
    },
    reviewMenuOptionText: {
        fontSize: 14,
        color: "#1f2937",
        fontWeight: "500",
    },
    reviewMenuOptionDelete: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#e5e7eb",
    },
    reviewMenuOptionDeleteText: {
        color: "#dc2626",
        fontWeight: "600",
    },
    reviewsActionsRow: {
        flexDirection: "row",
        marginTop: 12,
        justifyContent: "flex-start",
    },
    reviewsActionButton: {
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "transparent",
        borderColor: "#f97316",
        marginRight: 12,
    },
    reviewsActionButtonGhost: {
        backgroundColor: "#fff",
        borderColor: "#d1d5db",
    },
    reviewsActionText: {
        color: "#f97316",
        fontWeight: "600",
        fontSize: 13,
        textDecorationLine: "underline",
    },
    infoList: {
        paddingHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
    },
    infoCardTwoColumn: {
        width: "48%",
    },
    infoCardTwoColumnLeft: {
        marginRight: 12,
    },
    infoCardTwoColumnRight: {
        marginRight: 0,
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
    similarSection: {
        marginTop: 16,
    },
    similarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 12,
        marginHorizontal: 12,
    },
    similarCard: {
        width: "48%",
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
        marginBottom: 12,
        overflow: "hidden",
    },
    similarCardImage: {
        width: "100%",
        height: 120,
    },
    similarCardBody: {
        padding: 10,
        gap: 6,
    },
    similarCardSubtitle: {
        fontSize: 12,
        color: "#6b7280",
    },
    similarCardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    similarAddressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    similarCardAddress: {
        fontSize: 11,
        color: "#4b5563",
        flex: 1,
    },
    similarCardPrice: {
        fontSize: 13,
        fontWeight: "700",
        color: "#f97316",
    },
    similarEmptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 8,
    },
    similarErrorText: {
        textAlign: "center",
        color: "#dc2626",
        marginTop: 8,
    },
    similarLoadingWrapper: {
        paddingVertical: 12,
        alignItems: "center",
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
