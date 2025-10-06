import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

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
} from "../features/invoices/invoiceSlice";
import { axiosInstance } from "../api/axiosInstance";
import useHideTabBar from "../hooks/useHideTabBar";

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
  { key: "cancelled", label: "Đã hủy", statuses: ["CANCELLED"] },
  { key: "checkin", label: "Check-in", statuses: ["CHECKED_IN"] },
  { key: "completed", label: "Hoàn thành", statuses: ["COMPLETED"] },
];

const BOOKING_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  AWAITING_LANDLORD_APPROVAL: "Chờ chủ nhà duyệt",
  APPROVED: "Đã duyệt",
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

function buildVietQrImage(amount, invoiceNo) {
  if (!amount || !invoiceNo) return null;
  const rounded = Math.round(Number(amount));
  if (!rounded) return null;
  const encodedInfo = encodeURIComponent(invoiceNo);
  const encodedName = encodeURIComponent(BANK_INFO.accountName);
  return `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${rounded}&addInfo=${encodedInfo}&accountName=${encodedName}`;
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

export default function MyBookingsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const bookings = useSelector(selectMyBookings);
  const loading = useSelector(selectBookingsLoading);
  const invoice = useSelector(selectCurrentInvoice);
  const invoiceLoading = useSelector(selectInvoiceLoading);
  const invoiceError = useSelector(selectInvoiceError);

  const [activeTab, setActiveTab] = useState("pending");
  const [keyword, setKeyword] = useState("");
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyBookings());
    }, [dispatch])
  );

  useEffect(() => {
    if (!invoiceVisible) {
      dispatch(clearInvoice());
      setSelectedBookingId(null);
    }
  }, [invoiceVisible, dispatch]);

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
    return bookings.filter((booking) =>
      tabMeta.statuses.includes(booking.bookingStatus)
    );
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
      Alert.alert(
        "Hủy booking",
        "Bạn có chắc chắn muốn hủy booking này?",
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
    [dispatch]
  );

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
    [dispatch]
  );

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
                await dispatch(checkOutBooking(booking.bookingId)).unwrap();
                Alert.alert("Thành công", "Check-out thành công");
                dispatch(fetchMyBookings());
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
    [dispatch]
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const renderBooking = useCallback(
    ({ item }) => (
      <BookingCard
        booking={item}
        tab={activeTab}
        onView={(booking) =>
          navigation.navigate("BookingDetail", { id: booking.bookingId })
        }
        onPay={handleOpenInvoice}
        onCancel={handleCancel}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />
    ),
    [activeTab, navigation, handleOpenInvoice, handleCancel, handleCheckIn, handleCheckOut]
  );

  const listEmpty = (
    <View style={{ alignItems: "center", marginTop: 48 }}>
      <Image
        source={require("../../assets/images/empty_building.jpg")}
        style={{ width: 140, height: 140, marginBottom: 16, borderRadius: 16, opacity: 0.9 }}
        resizeMode="cover"
      />
      <Text style={{ color: MUTED }}>Chưa có booking phù hợp</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header onBack={() => navigation.goBack()} />

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: active ? 0 : 1,
        borderColor: BORDER,
        backgroundColor: active ? ORANGE : "#fff",
        marginRight: 10,
        shadowColor: "#000",
        shadowOpacity: active ? 0.12 : 0.04,
        shadowRadius: active ? 4 : 2,
        shadowOffset: { width: 0, height: active ? 2 : 1 },
        elevation: active ? 2 : 1,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : TEXT,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BookingCard({ booking, tab, onView, onPay, onCancel, onCheckIn, onCheckOut }) {
  const checkInAvailable = booking.bookingStatus === "APPROVED";
  const checkOutAvailable = booking.bookingStatus === "CHECKED_IN";
  const showCancelButton =
    tab === "pending" ||
    (tab === "approved" &&
      ["AWAITING_LANDLORD_APPROVAL", "APPROVED"].includes(booking.bookingStatus));
  const showPayButton = tab === "approved";
  const showCheckButtons = tab === "checkin";
  const media = booking.property?.media || [];
  const coverImage =
    media.find((item) => item.isCover) || media[0] || null;
  const imageUrl = coverImage?.url
    ? coverImage.url.startsWith("http")
      ? coverImage.url
      : `${MEDIA_BASE_URL}/${coverImage.url.replace(/^\/+/, "")}`
    : null;

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
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
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
            <StatusBadge status={booking.bookingStatus} />
          </View>

          <View style={{ marginTop: 12 }}>
            <InfoRow label="Tổng tiền" value={formatCurrency(booking.totalPrice)} bold />
            {booking.paymentStatus ? (
              <InfoRow
                label="Thanh toán"
                value={getPaymentStatusLabel(booking.paymentStatus)}
              />
            ) : null}
            {booking.note ? <InfoRow label="Ghi chú" value={booking.note} /> : null}
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
            label="Thanh toán"
            onPress={() => onPay(booking)}
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
      </View>
    </View>
  );
}

function StatusBadge({ status }) {
  const label = getBookingStatusLabel(status);
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

function InfoRow({ label, value, bold }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ color: MUTED, width: 90 }}>{label}</Text>
      <Text style={{ color: TEXT, fontWeight: bold ? "700" : "500", flex: 1 }}>
        {value}
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
  const amount = invoice?.total ?? invoice?.dueAmount;
  const qrImage = buildVietQrImage(amount, invoice?.invoiceNo);
  const formattedAmount = formatCurrency(amount);

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
              <Text style={{ fontSize: 18, fontWeight: "700", color: TEXT }}>Thanh toán booking</Text>
              {bookingId ? (
                <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>Mã booking: {bookingId}</Text>
              ) : null}
            </View>
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
              <Text style={{ color: TEXT, fontWeight: "600", marginBottom: 8 }}>
                Mở app ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền bên dưới.
              </Text>

              {qrImage ? (
                <Image
                  source={{ uri: qrImage }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 12, marginBottom: 16 }}
                  resizeMode="contain"
                />
              ) : null}

              <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <InfoRow label="Ngân hàng" value={BANK_INFO.bankName} />
                <InfoRow label="Chủ TK" value={BANK_INFO.accountName} />
                <InfoRow label="Số tài khoản" value={BANK_INFO.accountNumber} />
                {formattedAmount ? <InfoRow label="Số tiền" value={formattedAmount} bold /> : null}
                <InfoRow label="Nội dung" value={invoice.invoiceNo} />
                <InfoRow
                  label="Hạn thanh toán"
                  value={formatDateVN(invoice.dueAt)}
                />
              </View>

              {invoice.qrPayload ? (
                <View style={{ backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10 }}>
                  <Text style={{ color: MUTED, fontSize: 12 }}>QR Payload</Text>
                  <Text style={{ color: TEXT, marginTop: 4, fontSize: 12 }} selectable>
                    {invoice.qrPayload}
                  </Text>
                </View>
              ) : null}

              {formattedAmount ? (
                <Text style={{ marginTop: 12, color: "#ef4444", fontStyle: "italic" }}>
                  Lưu ý: Nhập chính xác số tiền {formattedAmount} khi chuyển khoản.
                </Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}