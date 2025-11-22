import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "@stomp/stompjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import S3Image from "../components/S3Image";
import { resolveAssetUrl } from "../utils/cdn";
import { recordUserEvent } from "../features/events/eventsThunks";

import {
  fetchMyBookings,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
} from "../features/bookings/bookingsThunks";
import {
  selectMyBookings,
  selectBookingsLoading,
} from "../features/bookings/bookingSlice";
import {
  fetchInvoiceByBooking,
} from "../features/invoices/invoiceThunks";
import {
  clearInvoice,
  selectCurrentInvoice,
  selectInvoiceError,
  selectInvoiceLoading,
  selectInvoicesByBookingId,
  selectInvoiceBookingId,
} from "../features/invoices/invoiceSlice";
import { axiosInstance } from "../api/axiosInstance";
import {
  createReviewThunk,
  updateReviewThunk,
  fetchReviewByBookingThunk,
  fetchPropertyReviewsSummary,
} from "../features/reviews/reviewsThunks";
import useHideTabBar from "../hooks/useHideTabBar";
import { getWsUrl } from "../utils/wsUrl";
import ReviewModal from "../components/reviews/ReviewModal";
import CancelReasonModal from "../components/CancelReasonModal";
import { upsertBookingReview } from "../features/reviews/reviewsSlice";

const ORANGE = "#f97316";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const SUCCESS = "#16a34a";

const API_BASE_URL = (axiosInstance.defaults.baseURL || "http://localhost:8080/api/v1").replace(/\/$/, "");
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

const BANK_INFO = {
  bankName: "Ngân hàng TMCP Quân đội",
  accountName: "TRAN TUAN KIET",
  accountNumber: "0001119551521",
};

const BOOKING_TABS = [
  { key: "pending", label: "Đang chờ duyệt", statuses: ["PENDING_PAYMENT"] },
  {
    key: "approved",
    label: "Đã duyệt",
    statuses: ["AWAITING_LANDLORD_APPROVAL", "APPROVED"],
  },
  { key: "checkin", label: "Check-in", statuses: ["CHECKED_IN"] },
  { key: "completed", label: "Hoàn thành", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Đã hủy", statuses: ["CANCELLED"] },
];

const BOOKING_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ duyệt",
  AWAITING_LANDLORD_APPROVAL: "Chờ thanh toán",
  APPROVED: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  CHECKED_IN: "Đang lưu trú",
  COMPLETED: "Hoàn thành",
};

const BOOKING_STATUS_COLORS = {
  PENDING_PAYMENT: "#f59e0b",
  AWAITING_LANDLORD_APPROVAL: "#2563eb",
  APPROVED: SUCCESS,
  CANCELLED: "#6b7280",
  CHECKED_IN: "#0ea5e9",
  COMPLETED: "#0d9488",
};

const PAYMENT_STATUS_LABELS = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  FAILED: "Thanh toán thất bại",
};

const INVOICE_STATUS_LABELS = {
  DRAFT: "Chưa phát hành",
  ISSUED: "Đã phát hành",
  PAID: "Đã thanh toán",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  VOID: "Đã hủy",
};

const INVOICE_STATUS_COLORS = {
  DRAFT: "#6b7280",
  ISSUED: "#f59e0b",
  PAID: SUCCESS,
  REFUND_PENDING: "#f97316",
  REFUNDED: "#0ea5e9",
  VOID: "#ef4444",
};

function formatDateVN(dateString) {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  if (value == null) return "";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getBookingStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] || status || "";
}

function getBookingStatusColor(status) {
  return BOOKING_STATUS_COLORS[status] || TEXT;
}

function getPaymentStatusLabel(status) {
  if (!status) return "";
  return PAYMENT_STATUS_LABELS[status] || status;
}

function getInvoiceStatusLabel(status) {
  if (!status) return "";
  return INVOICE_STATUS_LABELS[status] || status;
}

function getInvoiceStatusColor(status) {
  if (!status) return MUTED;
  return INVOICE_STATUS_COLORS[status] || TEXT;
}

function extractReviewFromBooking(booking) {
  if (!booking) return null;
  return (
    booking.review ||
    booking.myReview ||
    booking.tenantReview ||
    booking.reviewResponse ||
    booking.reviewDto ||
    booking.reviewResponseDto ||
    null
  );
}

function resolveBookingReview(booking, reviewsByBookingMap = {}) {
  if (!booking) return null;
  const bookingId = booking.bookingId || booking.id || null;
  if (
    bookingId &&
    reviewsByBookingMap &&
    Object.prototype.hasOwnProperty.call(reviewsByBookingMap, bookingId)
  ) {
    return reviewsByBookingMap[bookingId];
  }
  return extractReviewFromBooking(booking);
}

function getBookingTenantId(booking) {
  if (!booking) return null;
  const tenantKey =
    booking.tenant?.tenantId ||
    booking.tenant?.id ||
    booking.tenantId ||
    booking.tenant?.userId ||
    null;
  return tenantKey != null ? String(tenantKey) : null;
}

function getBookingPropertyId(booking) {
  if (!booking) return null;
  return (
    booking.property?.propertyId ||
    booking.propertyId ||
    booking.property?.id ||
    null
  );
}

function getBookingPropertyTitle(booking) {
  if (!booking) return "";
  return (
    booking.property?.title ||
    booking.propertyName ||
    booking.roomName ||
    ""
  );
}

function hexToRgba(hex, alpha = 0.16) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let sanitized = hex.replace("#", "");
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(sanitized, 16);
  if (Number.isNaN(bigint)) return `rgba(0,0,0,${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toStartOfDay(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function sortBookingsByProximity(bookings, getDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return [...bookings].sort((a, b) => {
    const dateA = toStartOfDay(getDate(a));
    const dateB = toStartOfDay(getDate(b));

    const timeA = dateA ? dateA.getTime() : Infinity;
    const timeB = dateB ? dateB.getTime() : Infinity;

    const deltaA = timeA - todayMs;
    const deltaB = timeB - todayMs;

    const scoreA = deltaA >= 0 ? deltaA : Math.abs(deltaA) + 1e12;
    const scoreB = deltaB >= 0 ? deltaB : Math.abs(deltaB) + 1e12;

    if (scoreA !== scoreB) return scoreA - scoreB;
    return timeA - timeB;
  });
}

export default function MyBookingsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const me = useSelector(s => s.auth.user);
  const dispatch = useDispatch();
  const route = useRoute();
  const bookings = useSelector(selectMyBookings);
  const loading = useSelector(selectBookingsLoading);
  const invoice = useSelector(selectCurrentInvoice);
  const invoiceLoading = useSelector(selectInvoiceLoading);
  const invoiceError = useSelector(selectInvoiceError);
  const invoicesByBookingId = useSelector(selectInvoicesByBookingId);
  const invoiceBookingId = useSelector(selectInvoiceBookingId);
  const authToken = useSelector((state) => state.auth.token);

  const [activeTab, setActiveTab] = useState("pending");
  const [keyword, setKeyword] = useState("");
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const pendingInvoiceRequests = useRef(new Set());
  const paymentClientRef = useRef(null);
  const paymentSubscriptionRef = useRef(null);
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [cancelReasonModalVisible, setCancelReasonModalVisible] = useState(false);
  const [cancelReasonBooking, setCancelReasonBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTargetBooking, setReviewTargetBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewsByBooking = useSelector((state) => state.reviews.byBooking || {});
  const bookingReviewStatus = useSelector(
    (state) => state.reviews.bookingStatus || {}
  );
  const appliedReviewSnapshotRef = useRef(null);
  const activeReview = useMemo(
    () => resolveBookingReview(reviewTargetBooking, reviewsByBooking),
    [reviewTargetBooking, reviewsByBooking]
  );

  const cleanupPaymentConnection = useCallback(() => {
    try {
      if (paymentSubscriptionRef.current) {
        paymentSubscriptionRef.current.unsubscribe();
      }
    } catch (e) {
      console.log("[WS] unsubscribe payment topic error", e?.message);
    }
    paymentSubscriptionRef.current = null;

    const client = paymentClientRef.current;
    paymentClientRef.current = null;
    if (client) {
      try {
        client.deactivate();
      } catch (e) {
        console.log("[WS] deactivate payment socket error", e?.message);
      }
    }
  }, []);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  useEffect(() => {
    const targetTab = route?.params?.tab;
    if (typeof targetTab !== "string") {
      return;
    }

    const tabExists = BOOKING_TABS.some((tab) => tab.key === targetTab);
    if (!tabExists) {
      return;
    }

    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }

    if (navigation && typeof navigation.setParams === "function") {
      navigation.setParams({ tab: undefined });
    }
  }, [route?.params?.tab, activeTab, navigation]);

  useEffect(() => {
    const reviewBookingId = route?.params?.openReviewForId;
    if (!reviewBookingId) {
      return;
    }

    const bookingFromList = Array.isArray(bookings)
      ? bookings.find(
        (item) => String(item?.bookingId) === String(reviewBookingId)
      )
      : null;

    const fallbackBooking =
      bookingFromList || route?.params?.reviewBookingSnapshot || null;

    if (fallbackBooking) {
      openReviewModal(fallbackBooking);
    }

    if (navigation && typeof navigation.setParams === "function") {
      navigation.setParams({
        openReviewForId: undefined,
        reviewBookingSnapshot: undefined,
        reviewTrigger: undefined,
      });
    }
  }, [
    route?.params?.openReviewForId,
    route?.params?.reviewTrigger,
    bookings,
    navigation,
    openReviewModal,
  ]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyBookings());
    }, [dispatch])
  );

  useEffect(() => {
    if (!Array.isArray(bookings)) {
      return;
    }

    bookings.forEach((booking) => {
      const bookingId = booking?.bookingId;
      if (!bookingId) {
        return;
      }

      const reviewFromPayload = extractReviewFromBooking(booking);
      if (
        reviewFromPayload &&
        (!reviewsByBooking[bookingId] ||
          reviewsByBooking[bookingId]?.reviewId !== reviewFromPayload?.reviewId)
      ) {
        dispatch(
          upsertBookingReview({
            bookingId,
            review: reviewFromPayload,
          })
        );
        return;
      }

      const mergedReview = resolveBookingReview(booking, reviewsByBooking);
      const status = bookingReviewStatus[bookingId];

      if (
        booking.bookingStatus === "COMPLETED" &&
        !mergedReview &&
        typeof status === "undefined"
      ) {
        dispatch(fetchReviewByBookingThunk(bookingId));
      }
    });
  }, [bookings, reviewsByBooking, bookingReviewStatus, dispatch]);

  useEffect(() => {
    if (!reviewModalVisible || !reviewTargetBooking || !activeReview) {
      return;
    }
    if (reviewSubmitting) {
      return;
    }

    const snapshotKey =
      activeReview.reviewId ||
      `${activeReview.rating ?? ""}-${activeReview.comment ?? ""}`;

    if (appliedReviewSnapshotRef.current === snapshotKey) {
      return;
    }

    setReviewRating(
      activeReview?.rating ? Number(activeReview.rating) : 0
    );
    setReviewComment(activeReview?.comment || "");
    appliedReviewSnapshotRef.current = snapshotKey;
  }, [
    reviewModalVisible,
    reviewTargetBooking,
    activeReview,
    reviewSubmitting,
  ]);

  useEffect(() => {
    if (!invoiceVisible) {
      dispatch(clearInvoice());
      setSelectedBookingId(null);
      cleanupPaymentConnection();
      if (!showPaymentSuccess) {
        setPaymentEvent(null);
      }
    }
  }, [invoiceVisible, dispatch, cleanupPaymentConnection, showPaymentSuccess]);

  useEffect(() => {
    cleanupPaymentConnection();

    if (
      !invoiceVisible ||
      !invoice?.invoiceId ||
      !selectedBookingId ||
      invoiceBookingId !== selectedBookingId
    ) {
      return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new WebSocket(wsUrl, ["v10.stomp", "v11.stomp", "v12.stomp"]),
      connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      reconnectDelay: 0,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      debug: () => { },
    });

    client.onConnect = () => {
      const destination = `/topic/payments/${invoice.invoiceId}`;
      try {
        paymentSubscriptionRef.current = client.subscribe(destination, (message) => {
          if (!message?.body) return;
          try {
            const payload = JSON.parse(message.body);
            if (payload?.type !== "PAYMENT_STATUS_CHANGED") return;
            const incomingInvoiceId = `${payload?.invoiceId || ""}`;
            if (incomingInvoiceId && incomingInvoiceId !== `${invoice.invoiceId}`) return;

            if (payload.success) {
              const bookingIdForRefresh = selectedBookingId;
              cleanupPaymentConnection();
              setPaymentEvent(payload);
              setShowPaymentSuccess(true);
              setInvoiceVisible(false);
              dispatch(fetchMyBookings());
              if (bookingIdForRefresh) {
                dispatch(fetchInvoiceByBooking(bookingIdForRefresh));
              }
              setActiveTab("approved");
            } else {
              Alert.alert(
                "Thanh toán thất bại",
                "Không thể xác nhận giao dịch. Vui lòng thử lại."
              );
            }
          } catch (error) {
            console.log("[WS] parse payment message error", error?.message);
          }
        });
      } catch (error) {
        console.log("[WS] subscribe payment error", error?.message);
      }
    };

    client.onStompError = (frame) => {
      console.log("[WS] payment STOMP error", frame?.headers, frame?.body);
    };
    client.onWebSocketClose = (evt) => {
      console.log("[WS] payment socket closed", evt?.code, evt?.reason);
    };

    paymentClientRef.current = client;
    client.activate();

    return () => {
      cleanupPaymentConnection();
    };
  }, [
    invoiceVisible,
    invoice?.invoiceId,
    invoiceBookingId,
    selectedBookingId,
    authToken,
    cleanupPaymentConnection,
    dispatch,
  ]); 

  useEffect(() => {
    const statusesNeedingInvoice = new Set([
      "AWAITING_LANDLORD_APPROVAL",
      "APPROVED",
      "CHECKED_IN",
      "COMPLETED",
    ]);

    const bookingsNeedingInvoice = bookings.filter((booking) =>
      statusesNeedingInvoice.has(booking.bookingStatus)
    );

    bookingsNeedingInvoice.forEach((booking) => {
      const bookingId = booking.bookingId;
      if (!bookingId) return;
      const hasInvoiceRecord =
        invoicesByBookingId &&
        Object.prototype.hasOwnProperty.call(invoicesByBookingId, bookingId);
      if (hasInvoiceRecord) return;
      if (pendingInvoiceRequests.current.has(bookingId)) return;

      pendingInvoiceRequests.current.add(bookingId);
      dispatch(fetchInvoiceByBooking(bookingId)).finally(() => {
        pendingInvoiceRequests.current.delete(bookingId);
      });
    });
  }, [bookings, invoicesByBookingId, dispatch]);

  const countsByTab = useMemo(() => {
    const counter = {};
    BOOKING_TABS.forEach((tab) => {
      counter[tab.key] = bookings.filter((b) =>
        tab.statuses.includes(b.bookingStatus)
      ).length;
    });
    return counter;
  }, [bookings]);

  const listByTab = useMemo(() => {
    const tabMeta = BOOKING_TABS.find((t) => t.key === activeTab);
    if (!tabMeta) return [];
    const filtered = bookings.filter((booking) =>
      tabMeta.statuses.includes(booking.bookingStatus)
    );

    if (activeTab === "approved") {
      return sortBookingsByProximity(filtered, (booking) => booking.startDate);
    }

    if (activeTab === "checkin") {
      return sortBookingsByProximity(filtered, (booking) => booking.endDate);
    }

    return filtered;
  }, [bookings, activeTab]);

  const filteredBookings = useMemo(() => {
    if (!keyword.trim()) return listByTab;
    const needle = keyword.trim().toLowerCase();
    return listByTab.filter((booking) => {
      const title = booking.property?.title || "";
      const note = booking.note || "";
      return (
        title.toLowerCase().includes(needle) ||
        note.toLowerCase().includes(needle)
      );
    });
  }, [keyword, listByTab]);

  const closeInvoiceModal = useCallback(() => {
    setInvoiceVisible(false);
  }, []);

  const handleOpenInvoice = useCallback(
    (booking) => {
      setInvoiceVisible(true);
      setSelectedBookingId(booking.bookingId);
      dispatch(fetchInvoiceByBooking(booking.bookingId));
    },
    [dispatch]
  );

  const handleCancel = useCallback(
    (booking) => {
      const bookingId = booking?.bookingId;
      const relatedInvoice =
        (bookingId && invoicesByBookingId?.[bookingId]) || booking?.invoice || null;
      const invoiceStatus = relatedInvoice?.status || booking?.invoiceStatus;
      const paymentStatus = booking?.paymentStatus;
      const paidStatuses = new Set(["PAID", "REFUND_PENDING", "REFUNDED"]);
      const wasPaid =
        (invoiceStatus && paidStatuses.has(invoiceStatus)) ||
        (paymentStatus && paidStatuses.has(paymentStatus));

      const title = wasPaid ? "Yêu cầu hoàn tiền" : "Hủy booking";
      const message = wasPaid
        ? "Booking này đã được thanh toán. Khi bạn hủy, hệ thống sẽ tạo yêu cầu hoàn tiền và admin sẽ xử lý trong vòng 24 giờ. Bạn có chắc chắn muốn tiếp tục?"
        : "Bạn có chắc chắn muốn hủy booking này?";

      if (wasPaid) {
        setCancelReasonBooking(booking);
        setCancelReason("");
        setCancelReasonError("");
        setCancelReasonModalVisible(true);
        return;
      }

      Alert.alert(
        title,
        message,
        [
          { text: "Không", style: "cancel" },
          {
            text: "Hủy booking",
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(cancelBooking(booking.bookingId)).unwrap();
                Alert.alert("Thành công", "Hủy booking thành công");
                dispatch(fetchMyBookings());
                setActiveTab("cancelled");
              } catch (error) {
                Alert.alert(
                  "Lỗi",
                  error?.message || "Không thể hủy booking, vui lòng thử lại"
                );
              }
            },
          },
        ]
      );
    },
    [dispatch, setActiveTab, invoicesByBookingId]
  );

  const closeCancelReasonModal = useCallback(() => {
    setCancelReasonModalVisible(false);
    setCancelReasonBooking(null);
    setCancelReason("");
    setCancelReasonError("");
  }, []);

  const submitCancelWithReason = useCallback(async () => {
    if (!cancelReasonBooking) {
      return;
    }

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelReasonError("Vui lòng nhập lý do hủy.");
      return;
    }

    setCancelSubmitting(true);
    try {
      await dispatch(
        cancelBooking({
          bookingId: cancelReasonBooking.bookingId,
          reason: trimmedReason,
        })
      ).unwrap();
      closeCancelReasonModal();
      Alert.alert(
        "Thành công",
        "Đã ghi nhận yêu cầu hoàn tiền. Vui lòng chờ tối đa 24 giờ để admin xử lý."
      );
      dispatch(fetchMyBookings());
      setActiveTab("cancelled");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể hủy booking, vui lòng thử lại"
      );
    } finally {
      setCancelSubmitting(false);
    }
  }, [
    cancelReason,
    cancelReasonBooking,
    closeCancelReasonModal,
    dispatch,
    setActiveTab,
  ]);

  const handleCheckIn = useCallback(
    (booking) => {
      Alert.alert(
        "Check-in",
        "Xác nhận bạn đã nhận phòng?",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Check-in",
            onPress: async () => {
              try {
                await dispatch(checkInBooking(booking.bookingId)).unwrap();
                Alert.alert("Thành công", "Check-in thành công");
                dispatch(fetchMyBookings());
                setActiveTab("checkin");
              } catch (error) {
                Alert.alert(
                  "Lỗi",
                  error?.message || "Không thể check-in lúc này"
                );
              }
            },
          },
        ]
      );
    },
    [dispatch, setActiveTab]
  );

  const openReviewModal = useCallback(
    (booking) => {
      if (!booking) return;
      setReviewTargetBooking(booking);
      const existingReview = resolveBookingReview(booking, reviewsByBooking);
      setReviewRating(existingReview?.rating ? Number(existingReview.rating) : 0);
      setReviewComment(existingReview?.comment || "");
      setReviewError("");
      setReviewModalVisible(true);
      appliedReviewSnapshotRef.current = existingReview
        ? existingReview.reviewId ||
        `${existingReview.rating ?? ""}-${existingReview.comment ?? ""}`
        : null;

      const bookingId = booking?.bookingId;
      const status = bookingId ? bookingReviewStatus[bookingId] : undefined;
      if (
        bookingId &&
        !existingReview &&
        status !== "loading" &&
        status !== "succeeded"
      ) {
        dispatch(fetchReviewByBookingThunk(bookingId));
      }
    },
    [dispatch, reviewsByBooking, bookingReviewStatus]
  );

  const closeReviewModal = useCallback(() => {
    setReviewModalVisible(false);
    setReviewTargetBooking(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
    appliedReviewSnapshotRef.current = null;
  }, []);

  const handleOpenReview = useCallback(
    (booking) => {
      openReviewModal(booking);
    },
    [openReviewModal]
  );

  const handleViewReview = useCallback(
    (booking) => {
      if (!booking) return;
      const propertyId = getBookingPropertyId(booking);
      if (!propertyId) return;
      const review = resolveBookingReview(booking, reviewsByBooking);
      const params = {
        propertyId,
        scrollToReviews: true,
        highlightReviewId: review?.reviewId || null,
        loggedViewEvent: true,
      };

      dispatch(
        recordUserEvent({
          eventType: "VIEW",
          roomId: propertyId,
          metadata: { source: "my_bookings", context: "view_review" },
        })
      );

      const parentNavigation = navigation.getParent?.();
      if (parentNavigation?.navigate) {
        parentNavigation.navigate("HomeTab", {
          screen: "PropertyDetail",
          params,
        });
        return;
      }

      navigation.navigate("PropertyDetail", params);
    },
    [dispatch, navigation, reviewsByBooking]
  );

  const handleSubmitReview = useCallback(async () => {
    if (!reviewTargetBooking) {
      return;
    }
    if (!reviewRating) {
      setReviewError("Vui lòng chọn số sao trước khi gửi đánh giá");
      return;
    }

    const bookingId = reviewTargetBooking.bookingId;
    const tenantId = getBookingTenantId(reviewTargetBooking);
    const propertyId = getBookingPropertyId(reviewTargetBooking);
    const existingReview = activeReview;

    if (!bookingId) {
      setReviewError("Không tìm thấy thông tin booking");
      return;
    }
    if (!tenantId && !existingReview) {
      setReviewError("Không tìm thấy thông tin người thuê");
      return;
    }

    setReviewSubmitting(true);
    try {
      if (existingReview?.reviewId) {
        await dispatch(
          updateReviewThunk({
            reviewId: existingReview.reviewId,
            bookingId,
            propertyId,
            rating: reviewRating,
            comment: reviewComment,
          })
        ).unwrap();
        Alert.alert("Thành công", "Cập nhật đánh giá thành công");
      } else {
        await dispatch(
          createReviewThunk({
            bookingId,
            tenantId,
            propertyId,
            rating: reviewRating,
            comment: reviewComment,
          })
        ).unwrap();
        Alert.alert("Thành công", "Cảm ơn bạn đã chia sẻ trải nghiệm");
      }
      closeReviewModal();
      dispatch(fetchMyBookings());
      if (propertyId) {
        dispatch(fetchPropertyReviewsSummary(propertyId));
      }
    } catch (error) {
      const message =
        (typeof error === "string" && error) ||
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể gửi đánh giá. Vui lòng thử lại.";
      const messageText =
        typeof message === "string"
          ? message
          : "Không thể gửi đánh giá. Vui lòng thử lại.";

      if (
        typeof messageText === "string" &&
        messageText.toLowerCase().includes("đánh giá booking này")
      ) {
        try {
          const response = await dispatch(
            fetchReviewByBookingThunk(bookingId)
          ).unwrap();
          const fetchedReview = response?.review;
          if (fetchedReview) {
            dispatch(
              upsertBookingReview({ bookingId, review: fetchedReview })
            );
            setReviewRating(
              fetchedReview?.rating ? Number(fetchedReview.rating) : reviewRating
            );
            setReviewComment(fetchedReview?.comment || reviewComment);
          }
        } catch (fetchError) {
          console.warn("Không thể tải đánh giá đã tồn tại", fetchError);
        }
        setReviewError(
          "Bạn đã đánh giá booking này. Bạn có thể cập nhật lại nếu muốn thay đổi."
        );
      } else {
        setReviewError(messageText);
      }
    } finally {
      setReviewSubmitting(false);
    }
  }, [
    reviewTargetBooking,
    reviewRating,
    reviewComment,
    activeReview,
    dispatch,
    closeReviewModal,
  ]);

  const handleCheckOut = useCallback(
    (booking) => {
      Alert.alert(
        "Check-out",
        "Xác nhận bạn đã trả phòng?",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Check-out",
            onPress: async () => {
              try {
                const updated = await dispatch(
                  checkOutBooking(booking.bookingId)
                ).unwrap();
                Alert.alert("Thành công", "Check-out thành công");
                dispatch(fetchMyBookings());
                setActiveTab("completed");
                if (updated) {
                  openReviewModal(updated);
                } else {
                  openReviewModal(booking);
                }
              } catch (error) {
                Alert.alert(
                  "Lỗi",
                  error?.message || "Không thể check-out lúc này"
                );
              }
            },
          },
        ]
      );
    },
    [dispatch, setActiveTab, openReviewModal]
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const renderBooking = useCallback(
    ({ item }) => {
      const review = resolveBookingReview(item, reviewsByBooking);
      return (
        <BookingCard
          booking={item}
          review={review}
          tab={activeTab}
          invoice={invoicesByBookingId?.[item.bookingId]}
          invoiceFetched={
            !!(
              invoicesByBookingId &&
              Object.prototype.hasOwnProperty.call(
                invoicesByBookingId,
                item.bookingId
              )
            )
          }
          onView={(booking) =>
            navigation.navigate("BookingDetail", { id: booking.bookingId })
          }
          onPay={handleOpenInvoice}
          onCancel={handleCancel}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onReview={handleOpenReview}
          onViewReview={handleViewReview}
        />
      );
    },
    [
      activeTab,
      navigation,
      invoicesByBookingId,
      reviewsByBooking,
      handleOpenInvoice,
      handleCancel,
      handleCheckIn,
      handleCheckOut,
      handleOpenReview,
      handleViewReview,
    ]
  );

  const listEmpty = (
    <View style={{ alignItems: "center", marginTop: 48 }}>
      <S3Image
        src="https://picsum.photos/140/140"
        style={{ width: 140, height: 140, marginBottom: 16, borderRadius: 16, opacity: 0.9 }}
        alt="empty-building"
      />
      <Text style={{ color: MUTED }}>Chưa có booking phù hợp</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header
        onBack={() => {
          if (navigation?.canGoBack?.()) {
            const state = navigation.getState?.();
            const routes = state?.routes || [];
            const previousRoute = routes[routes.length - 2];
            if (previousRoute?.name === "ProfileMain") {
              navigation.goBack();
              return;
            }
          }
          navigation.navigate("ProfileMain");
        }}
      />

      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: BORDER,
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm kiếm theo phòng hoặc ghi chú"
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1, color: TEXT }}
        />
      </View>
      <View style={{ height: 55, marginTop: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        >
          {BOOKING_TABS.map((tab) => (
            <TabButton
              key={tab.key}
              label={`${tab.label}${countsByTab[tab.key] ? ` (${countsByTab[tab.key]})` : ""}`}
              active={tab.key === activeTab}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading && bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.bookingId}
          renderItem={renderBooking}
          ListEmptyComponent={listEmpty}
          refreshing={loading}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        />
      )}

      <InvoiceModal
        visible={invoiceVisible}
        loading={invoiceLoading}
        invoice={invoice}
        error={invoiceError}
        bookingId={selectedBookingId}
        onClose={closeInvoiceModal}
      />
      <PaymentSuccessModal
        visible={showPaymentSuccess}
        payload={paymentEvent}
        onClose={() => {
          setShowPaymentSuccess(false);
          setPaymentEvent(null);
        }}
      />
      <ReviewModal
        visible={reviewModalVisible}
        title={
          activeReview
            ? "Cập nhật đánh giá"
            : "Đánh giá trải nghiệm"
        }
        subtitle={(() => {
          const title = getBookingPropertyTitle(reviewTargetBooking);
          return title ? `Cho ${title}` : undefined;
        })()}
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
        onCancel={closeReviewModal}
        onSubmit={handleSubmitReview}
        submitLabel={
          activeReview ? "Cập nhật" : "Đánh giá"
        }
      />
      <CancelReasonModal
        visible={cancelReasonModalVisible}
        title="Yêu cầu hoàn tiền"
        description="Booking này đã được thanh toán. Khi bạn hủy, hệ thống sẽ tạo yêu cầu hoàn tiền và admin sẽ xử lý trong vòng 24 giờ. Bạn có chắc chắn muốn tiếp tục?"
        reason={cancelReason}
        onReasonChange={(text) => {
          setCancelReason(text);
          if (cancelReasonError) {
            setCancelReasonError("");
          }
        }}
        errorMessage={cancelReasonError}
        submitting={cancelSubmitting}
        onCancel={closeCancelReasonModal}
        onSubmit={submitCancelWithReason}
        confirmLabel="Xác nhận hủy"
      />
    </View>
  );
}

function Header({ onBack }) {
  return (
    <View
      style={{
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        borderBottomColor: BORDER,
        borderBottomWidth: 1,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={TEXT} />
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: "700", color: TEXT }}>Booking của tôi</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 24,
        borderWidth: active ? 0 : 1,
        borderColor: BORDER,
        backgroundColor: active ? ORANGE : "#fff",
        marginRight: 8,
        shadowColor: "#000",
        shadowOpacity: active ? 0.12 : 0.04,
        shadowRadius: active ? 4 : 2,
        shadowOffset: { width: 0, height: active ? 2 : 1 },
        elevation: active ? 2 : 1,
      }}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color: active ? "#fff" : TEXT,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BookingCard({
  booking,
  review,
  invoice,
  invoiceFetched = false,
  tab,
  onView,
  onPay,
  onCancel,
  onCheckIn,
  onCheckOut,
  onReview,
  onViewReview,
}) {
  const invoiceStatus =
    invoice?.status || booking.invoiceStatus || booking.invoice?.status;
  const invoiceStatusLabel = getInvoiceStatusLabel(invoiceStatus);
  const invoiceStatusColor = getInvoiceStatusColor(invoiceStatus);
  const isInvoicePaid =
    invoiceStatus === "PAID" || booking.paymentStatus === "PAID";
  const isRefundPending =
    invoiceStatus === "REFUND_PENDING";
  const invoiceRowValue = invoiceStatusLabel
    ? invoiceStatusLabel
    : invoiceFetched
      ? "Chưa có hóa đơn"
      : "Đang tải hóa đơn...";
  const checkInAvailable =
    booking.bookingStatus === "APPROVED" ||
    (booking.bookingStatus === "AWAITING_LANDLORD_APPROVAL" && isInvoicePaid);
  const checkOutAvailable = booking.bookingStatus === "CHECKED_IN";
  const showCancelButton =
    tab === "pending" ||
    (tab === "approved" &&
      ["AWAITING_LANDLORD_APPROVAL", "APPROVED"].includes(booking.bookingStatus));
  const showPayButton = tab === "approved";
  const showCheckButtons = tab === "checkin";
  const showReviewActions = tab === "completed";
  const showInvoiceStatus = booking.bookingStatus === "AWAITING_LANDLORD_APPROVAL";
  const showRefundInvoiceButton = tab === "cancelled" && isRefundPending;
  const media = booking.property?.media || [];
  const coverImage =
    media.find((item) => item.isCover) || media[0] || null;
  const imageUrl = coverImage?.url ? resolveAssetUrl(coverImage.url) : null;
  const cancellationReason = (() => {
    const reasonSources = [
      booking?.cancellationReason,
      booking?.invoice?.cancellationReason,
    ];
    for (const reason of reasonSources) {
      if (typeof reason === "string" && reason.trim()) {
        return reason.trim();
      }
    }
    return "";
  })();
  const showCancellationReason = booking.bookingStatus === "CANCELLED";

  const handleViewPress = useCallback(() => onView(booking), [onView, booking]);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            backgroundColor: "#f3f4f6",
            overflow: "hidden",
            marginRight: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageUrl ? (
            <S3Image
              src={imageUrl}
              style={{ width: "100%", height: "100%" }}
              alt={`booking-${booking.bookingId}`}
            />
          ) : (
            <Ionicons name="home-outline" size={28} color={ORANGE} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: TEXT }} numberOfLines={2}>
                {booking.property?.title || "Phòng chưa cập nhật"}
              </Text>
              <Text style={{ color: MUTED, marginTop: 4 }}>
                {formatDateVN(booking.startDate)} - {formatDateVN(booking.endDate)}
              </Text>
            </View>
            <StatusBadge
              status={booking.bookingStatus}
              invoiceStatus={invoiceStatus}
              paymentStatus={booking.paymentStatus}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <InfoRow label="Tổng tiền" value={formatCurrency(booking.totalPrice)} bold />
            {showInvoiceStatus ? (
              <InfoRow
                label="Hóa đơn"
                value={invoiceRowValue}
                valueColor={invoiceStatusLabel ? invoiceStatusColor : MUTED}
                bold={invoiceStatus === "PAID"}
              />
            ) : null}
            {booking.paymentStatus ? (
              <InfoRow
                label="Thanh toán"
                value={getPaymentStatusLabel(booking.paymentStatus)}
              />
            ) : null}
            {booking.note ? <InfoRow label="Ghi chú" value={booking.note} /> : null}
            {showCancellationReason ? (
              <InfoRow
                label="Lý do hủy"
                value={cancellationReason || "-"}
                labelWidth={110}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18 }}>
        <ActionButton
          label="Xem"
          type="outline"
          onPress={handleViewPress}
          style={{ marginRight: 10, marginBottom: 10 }}
        />

        {showPayButton && (
          <ActionButton
            label={isInvoicePaid ? "Check-in" : "Thanh toán"}
            onPress={() =>
              isInvoicePaid
                ? checkInAvailable && onCheckIn(booking)
                : onPay(booking)
            }
            backgroundColor={isInvoicePaid ? SUCCESS : undefined}
            disabled={isInvoicePaid ? !checkInAvailable : false}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}

        {showCancelButton && (
          <ActionButton
            label="Hủy"
            onPress={() => onCancel(booking)}
            backgroundColor="#ef4444"
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}

        {showCheckButtons && (
          <>
            <ActionButton
              label="Check-in"
              type="outline"
              backgroundColor={SUCCESS}
              disabled={!checkInAvailable}
              onPress={() => checkInAvailable && onCheckIn(booking)}
              style={{ marginRight: 10, marginBottom: 10 }}
            />
            <ActionButton
              label="Check-out"
              backgroundColor="#2563eb"
              disabled={!checkOutAvailable}
              onPress={() => checkOutAvailable && onCheckOut(booking)}
              style={{ marginRight: 10, marginBottom: 10 }}
            />
          </>
        )}

        {showReviewActions && (
          <ActionButton
            label={review ? "Xem lại đánh giá" : "Đánh giá"}
            backgroundColor="#f97316"
            onPress={() =>
              review ? onViewReview?.(booking) : onReview?.(booking)
            }
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}

        {showRefundInvoiceButton && (
          <ActionButton
            label="Xem hóa đơn"
            type="outline"
            onPress={() => onPay(booking)}
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        )}
      </View>
    </View>
  );
}

function StatusBadge({ status, invoiceStatus, paymentStatus }) {
  const refundPending =
    status === "CANCELLED" &&
    (invoiceStatus === "REFUND_PENDING" || paymentStatus === "REFUND_PENDING");
  const label = refundPending ? "Đã hủy chờ hoàn tiền" : getBookingStatusLabel(status);
  const color = getBookingStatusColor(status);
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: hexToRgba(color, 0.16),
      }}
    >
      <Text style={{ color, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, bold, valueColor, labelWidth = 90 }) {
  if (value == null) return null;
  const displayValue =
    typeof value === "string" && value.trim() === "" ? "-" : value;
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ color: MUTED, width: labelWidth }}>{label}</Text>
      <Text
        style={{
          color: valueColor || TEXT,
          fontWeight: bold ? "700" : "500",
          flex: 1,
        }}
      >
        {displayValue}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  backgroundColor = ORANGE,
  type = "solid",
  disabled = false,
  style,
}) {
  const solid = type === "solid";
  const bgColor = solid ? backgroundColor : "#fff";
  const textColor = solid ? "#fff" : backgroundColor;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: disabled ? "#d1d5db" : bgColor,
        borderWidth: solid ? 0 : 1.5,
        borderColor: backgroundColor,
        minWidth: 104,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      <Text style={{ color: disabled ? "#6b7280" : textColor, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function InvoiceModal({ visible, loading, invoice, error, bookingId, onClose }) {
  const dispatch = useDispatch();
  const [confirming, setConfirming] = useState(false);
  const amount = invoice?.total ?? invoice?.dueAmount;
  const qrPayload = invoice?.qrPayload;
  const formattedAmount = formatCurrency(amount);
  const status = invoice?.status;
  const statusLabel = getInvoiceStatusLabel(status);
  const statusColor = getInvoiceStatusColor(status);
  const showRefundDetails = status === "REFUND_PENDING" || status === "REFUNDED";
  const isPaidStatus = status === "PAID";
  const showPaymentSection = !showRefundDetails && !isPaidStatus;
  const totalFormatted = formatCurrency(invoice?.total);
  const dueAmountFormatted = formatCurrency(invoice?.dueAmount);
  const cancellationFeeFormatted = formatCurrency(invoice?.cancellationFee);
  const refundableAmountFormatted = formatCurrency(invoice?.refundableAmount);
  const paidAtLabel = formatDateTimeVN(invoice?.paidAt);
  const dueAtLabel = formatDateTimeVN(invoice?.dueAt);
  const issuedAtLabel = formatDateTimeVN(invoice?.issuedAt);
  const cancelledAtLabel = formatDateTimeVN(invoice?.cancelledAt);
  const refundRequestedLabel = formatDateTimeVN(invoice?.refundRequestedAt);
  const refundConfirmedLabel = formatDateTimeVN(invoice?.refundConfirmedAt);
  const withFallback = (value, fallback = "-") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string" && value.trim() === "") {
      return fallback;
    }
    return value;
  };
  const invoiceNoDisplay = withFallback(invoice?.invoiceNo);
  const totalDisplay = withFallback(totalFormatted);
  const dueAmountDisplay = withFallback(dueAmountFormatted);
  const cancellationFeeDisplay = withFallback(cancellationFeeFormatted);
  const refundableAmountDisplay = withFallback(refundableAmountFormatted);
  const issuedAtDisplay = withFallback(issuedAtLabel);
  const dueAtDisplay = withFallback(dueAtLabel);
  const paidAtDisplay = withFallback(paidAtLabel);
  const cancelledAtDisplay = withFallback(cancelledAtLabel);
  const refundRequestedDisplay = withFallback(refundRequestedLabel);
  const refundConfirmedDisplay = withFallback(refundConfirmedLabel);
  const refundConfirmedText = invoice?.refundConfirmed
    ? "Đã xác nhận"
    : "Đang xử lý";
  const paymentAmountRaw = invoice?.dueAmount ?? invoice?.total ?? 0;
  const paymentAmount =
    typeof paymentAmountRaw === "number"
      ? paymentAmountRaw
      : Number(paymentAmountRaw) || 0;

  const handleConfirmPayment = async () => {
    if (!invoice?.invoiceId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin hóa đơn để xác nhận.");
      return;
    }

    if (confirming) {
      return;
    }

    setConfirming(true);
    try {
      await axiosInstance.post("/payments/confirm", {
        invoiceId: invoice.invoiceId,
        amount: paymentAmount,
        transactionId: `VIRTUAL_${Date.now()}`,
      });

      if (bookingId) {
        dispatch(fetchInvoiceByBooking(bookingId));
      }
      dispatch(fetchMyBookings());
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Không thể xác nhận thanh toán, vui lòng thử lại.";
      Alert.alert("Lỗi", message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: 24,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            maxHeight: "90%",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: TEXT }}>Thanh toán đặt phòng</Text>
            </View>
            {statusLabel ? (
                <View
                  style={{
                    marginTop: 6,
                    alignSelf: "flex-start",
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: statusColor,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <Text style={{ color: statusColor, fontWeight: "600" }}>{statusLabel}</Text>
                </View>
              ) : null}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Ionicons name="alert-circle" size={36} color="#ef4444" />
              <Text style={{ color: "#ef4444", marginTop: 8, textAlign: "center" }}>{error}</Text>
            </View>
          ) : invoice ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginTop: 16 }}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              <View
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <InfoRow label="Mã hóa đơn" value={invoiceNoDisplay} />
                <InfoRow label="Tổng tiền" value={totalDisplay} bold />
                <InfoRow label="Số tiền cần thanh toán" value={dueAmountDisplay} />
                <InfoRow label="Phí hủy" value={cancellationFeeDisplay} />
                <InfoRow label="Số tiền hoàn" value={refundableAmountDisplay} bold />
              </View>

              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text style={{ color: TEXT, fontWeight: "600", marginBottom: 8 }}>
                  Mốc thời gian
                </Text>
                <InfoRow label="Phát hành lúc" value={issuedAtDisplay} labelWidth={140} />
                <InfoRow label="Hạn thanh toán" value={dueAtDisplay} labelWidth={140} />
                <InfoRow label="Thanh toán lúc" value={paidAtDisplay} labelWidth={140} />
                <InfoRow label="Hủy hóa đơn" value={cancelledAtDisplay} labelWidth={140} />
                <InfoRow
                  label="Yêu cầu hoàn tiền"
                  value={refundRequestedDisplay}
                  labelWidth={140}
                />
                <InfoRow label="Hoàn tiền lúc" value={refundConfirmedDisplay} labelWidth={140} />
              </View>

              {showRefundDetails ? (
                <View
                  style={{
                    backgroundColor: "#fff7ed",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#fdba74",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: "#c2410c", fontWeight: "600", marginBottom: 8 }}>
                    {status === "REFUND_PENDING"
                      ? "Yêu cầu hoàn tiền đang được xử lý trong tối đa 24 giờ."
                      : "Yêu cầu hoàn tiền đã được hoàn tất."}
                  </Text>
                  <InfoRow label="Phí hủy" value={cancellationFeeDisplay} />
                  <InfoRow label="Số tiền hoàn lại" value={refundableAmountDisplay} bold />
                  <View style={{ flexDirection: "row", marginBottom: 6 }}>
                    <Text style={{ color: MUTED, width: 140 }}>Trạng thái hoàn tiền</Text>
                    <Text style={{ color: TEXT, fontWeight: "600", flex: 1 }}>{refundConfirmedText}</Text>
                  </View>
                  <InfoRow label="Thời gian yêu cầu" value={refundRequestedDisplay} />
                  {status === "REFUNDED" ? (
                    <InfoRow label="Thời gian hoàn tiền" value={refundConfirmedDisplay} />
                  ) : null}
                  <Text style={{ color: "#92400e", marginTop: 8, fontStyle: "italic" }}>
                    Cảm ơn bạn đã kiên nhẫn trong khi chúng tôi xử lý khoản hoàn tiền.
                  </Text>
                </View>
              ) : null}

              {isPaidStatus ? (
                <View
                  style={{
                    backgroundColor: "#ecfdf5",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#6ee7b7",
                  }}
                >
                  <Text style={{ color: "#047857", fontWeight: "600" }}>
                    Hóa đơn đã được thanh toán. Cảm ơn bạn!
                  </Text>
                </View>
              ) : null}

              {showPaymentSection ? (
                <>
                  <Text style={{ color: TEXT, fontWeight: "600", marginBottom: 8 }}>
                    Mở app ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền bên dưới.
                  </Text>

                  {qrPayload ? (
                    <View style={{ alignItems: "center", marginBottom: 16 }}>
                      <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "600", color: TEXT }}>
                        Quét QR để thanh toán
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#fff",
                          padding: 16,
                          borderRadius: 16,
                          shadowColor: "#000",
                          shadowOpacity: 0.08,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 3,
                        }}
                      >
                        <QRCode value={qrPayload} size={220} ecl="M" quietZone={10} backgroundColor="#fff" />
                      </View>
                    </View>
                  ) : null}

                  <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                    <InfoRow label="Ngân hàng" value={BANK_INFO.bankName} />
                    <InfoRow label="Chủ TK" value={BANK_INFO.accountName} />
                    <InfoRow label="Số tài khoản" value={BANK_INFO.accountNumber} />
                    {formattedAmount ? <InfoRow label="Số tiền" value={formattedAmount} bold /> : null}
                    <InfoRow label="Nội dung" value={invoice.invoiceNo} />
                    {invoice?.dueAt ? (
                      <InfoRow label="Hạn thanh toán" value={dueAtDisplay} />
                    ) : null}
                  </View>

                  {formattedAmount ? (
                    <Text style={{ marginTop: 12, color: "#ef4444", fontStyle: "italic" }}>
                      Lưu ý: Nhập chính xác số tiền {formattedAmount} khi chuyển khoản.
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleConfirmPayment}
                    disabled={confirming}
                    style={{
                      marginTop: 18,
                      backgroundColor: confirming ? "#d1d5db" : ORANGE,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    {confirming ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                        Xác nhận đã thanh toán
                      </Text>
                    )}
                  </TouchableOpacity>

                  <Text style={{ marginTop: 8, color: MUTED, textAlign: "center" }}>
                    Sử dụng nút này để xác nhận giao dịch sau khi bạn đã chuyển khoản.
                  </Text>
                </>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function formatDateTimeVN(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function PaymentSuccessModal({ visible, payload, onClose }) {
  const amountLabel =
    payload?.amount != null && !Number.isNaN(Number(payload.amount))
      ? formatCurrency(Number(payload.amount))
      : null;
  const paidAtLabel = payload?.paidAt ? formatDateTimeVN(payload.paidAt) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 28,
            width: "100%",
            maxWidth: 360,
            alignItems: "flex-start",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: "#dcfce7",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
              alignSelf: "center",
            }}
          >
            <Ionicons name="checkmark" size={42} color={SUCCESS} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: SUCCESS,
              marginBottom: 8,
              alignSelf: "center",
            }}
          >
            Thanh toán thành công
          </Text>
          <Text style={{ color: TEXT, marginBottom: 16 }}>
            Giao dịch của bạn đã được xác nhận thành công.
          </Text>
          {amountLabel ? (
            <Text style={{ fontWeight: "600", color: TEXT, marginBottom: 4 }}>
              Số tiền: <Text style={{ color: SUCCESS }}>{amountLabel}</Text>
            </Text>
          ) : null}
          {payload?.invoiceNo ? (
            <Text style={{ color: MUTED, marginBottom: 4 }}>Mã hóa đơn: {payload.invoiceNo}</Text>
          ) : null}
          {paidAtLabel ? (
            <Text style={{ color: MUTED, marginBottom: 16 }}>Thời gian: {paidAtLabel}</Text>
          ) : (
            <View style={{ height: 8 }} />
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: SUCCESS,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 999,
              marginTop: 4,
              alignSelf: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}