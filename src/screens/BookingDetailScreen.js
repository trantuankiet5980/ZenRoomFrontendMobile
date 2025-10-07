import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Linking,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchBookingById,
    cancelBooking,
    checkInBooking,
    checkOutBooking,
} from "../features/bookings/bookingsThunks";
import {
    selectBookingDetail,
    selectBookingsLoading,
} from "../features/bookings/bookingSlice";
import {
    fetchContractByBooking,
} from "../features/contracts/contractThunks";
import {
    clearContractDetail,
    selectContractDetail,
    selectContractsError,
    selectContractsLoading,
} from "../features/contracts/contractSlice";
import { useRoute, useNavigation } from "@react-navigation/native";
import { axiosInstance } from "../api/axiosInstance";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

const ORANGE = "#f36031";
const TEXT = "#111827";

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
    APPROVED: "#16a34a",
    CANCELLED: "#6b7280",
    CHECKED_IN: "#0ea5e9",
    COMPLETED: "#0d9488",
};

const CONTRACT_STATUS_LABELS = {
    PENDING_REVIEW: "Chờ thanh toán",
    ACTIVE: "Có hiệu lực",
    CANCELLED: "Đã hủy",
};

const CONTRACT_STATUS_COLORS = {
    PENDING_REVIEW: "#f59e0b",
    ACTIVE: "#16a34a",
    CANCELLED: "#dc2626",
};

const PAYMENT_STATUS_LABELS = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
    FAILED: "Thanh toán thất bại",
};

function withAlpha(hex, alpha = 0.16) {
    if (!hex) {
        return `rgba(0,0,0,${alpha})`;
    }
    let sanitized = hex.replace("#", "");
    if (sanitized.length === 3) {
        sanitized = sanitized
            .split("")
            .map((char) => char + char)
            .join("");
    }
    const bigint = parseInt(sanitized, 16);
    if (Number.isNaN(bigint)) {
        return `rgba(0,0,0,${alpha})`;
    }
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDateVN(dateString) {
  if (!dateString) return "";

  // Nếu chỉ có yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  const d = new Date(dateString);
  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
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
function formatAddress(address) {
    if (!address) return "";
    let text = address.addressFull || "";
    text = text.replace(/_/g, " ");
    return text
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}



function getBookingStatusLabel(status) {
    return BOOKING_STATUS_LABELS[status] || status || "";
}

function getBookingStatusColor(status) {
    return BOOKING_STATUS_COLORS[status] || TEXT;
}

function getContractStatusLabel(status) {
    if (!status) return "";
    return CONTRACT_STATUS_LABELS[status] || status;
}

function getContractStatusColor(status) {
    return CONTRACT_STATUS_COLORS[status] || TEXT;
}

function getPaymentStatusLabel(status) {
    if (!status) return "";
    return PAYMENT_STATUS_LABELS[status] || status;
}

export default function BookingDetailScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;

    const booking = useSelector(selectBookingDetail);
    const loading = useSelector(selectBookingsLoading);
    const contract = useSelector(selectContractDetail);
    const contractLoading = useSelector(selectContractsLoading);
    const contractError = useSelector(selectContractsError);
    const [downloadingContract, setDownloadingContract] = useState(false); 
    const contractStatus = contract?.status || contract?.contractStatus;
    const contractLabel = getContractStatusLabel(contractStatus) || "Đang cập nhật";
    const contractColor = getContractStatusColor(contractStatus);

    useEffect(() => {
        if (id) {
            dispatch(fetchBookingById(id));
            dispatch(fetchContractByBooking(id));
        }
        return () => {
            dispatch(clearContractDetail());
        };
    }, [dispatch, id]);

    const handleCancel = () => {
        Alert.alert(
            "Hủy booking",
            "Bạn có chắc chắn muốn hủy booking này?",
            [
                { text: "Không", style: "cancel" },
                {
                    text: "Hủy",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await dispatch(cancelBooking(id)).unwrap();
                            Alert.alert("Thành công", "Hủy booking thành công");
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert(
                                "Lỗi",
                                err?.message || "Không thể hủy booking, vui lòng thử lại"
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleCheckIn = () => {
        Alert.alert(
            "Check-in",
            "Xác nhận bạn đã nhận phòng?",
            [
                { text: "Đóng", style: "cancel" },
                {
                    text: "Check-in",
                    onPress: async () => {
                        try {
                            await dispatch(checkInBooking(id)).unwrap();
                            Alert.alert("Thành công", "Check-in thành công");
                        } catch (err) {
                            Alert.alert("Lỗi", err?.message || "Check-in thất bại");
                        }
                    },
                },
            ]
        );
    };

    const handleCheckOut = () => {
        Alert.alert(
            "Check-out",
            "Xác nhận bạn đã trả phòng?",
            [
                { text: "Đóng", style: "cancel" },
                {
                    text: "Check-out",
                    onPress: async () => {
                        try {
                            await dispatch(checkOutBooking(id)).unwrap();
                            Alert.alert("Thành công", "Check-out thành công");
                        } catch (err) {
                            Alert.alert("Lỗi", err?.message || "Check-out thất bại");
                        }
                    },
                },
            ]
        );
    };

    const handleOpenContractPdf = async () => {
        const contractId = booking?.contractId;
        if (downloadingContract) {
            return;
        }
        if (!contractId) {
            Alert.alert("Thông báo", "Chưa có hợp đồng cho booking này.");
            return;
        }
        try {
            setDownloadingContract(true);
            const baseUrl = (axiosInstance.defaults.baseURL || "http://localhost:8080/api/v1").replace(/\/$/, "");
            const pdfUrl = `${baseUrl}/contracts/${contractId}/pdf`;
            const token = await SecureStore.getItemAsync("accessToken");
            const fileName = `contract-${contractId}.pdf`;
            const baseDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
            if (!baseDirectory) {
                throw new Error("No writable directory available");
            }
            const normalizedDirectory = baseDirectory.endsWith("/") ? baseDirectory : `${baseDirectory}/`;
            const targetUri = `${normalizedDirectory}${fileName}`;
            const downloadResult = await FileSystem.downloadAsync(pdfUrl, targetUri, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (downloadResult.status < 200 || downloadResult.status >= 300) {
                throw new Error("Download failed");
            }

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Chia sẻ hợp đồng",
                });
            } else {
                Alert.alert(
                    "Thông báo",
                    "Thiết bị không hỗ trợ chia sẻ tệp. Hợp đồng đã được tải về thành công.",
                );
            }
        } catch (error) {
            console.error("Download contract pdf error", error);
            const message =
                error?.message === "No writable directory available"
                    ? "Thiết bị không hỗ trợ lưu tệp tải xuống."
                    : "Không thể tải hợp đồng. Vui lòng thử lại sau.";
            Alert.alert("Lỗi", message);
        } finally {
            setDownloadingContract(false);
        }
    };

    if (loading || !booking) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={ORANGE} />
            </View>
        );
    }

    const bottomActions = [];

    if (["PENDING_PAYMENT", "AWAITING_LANDLORD_APPROVAL"].includes(booking.bookingStatus)) {
        bottomActions.push({
            key: "cancel",
            label: "Hủy booking",
            color: "#ef4444",
            onPress: handleCancel,
        });
    }

    if (booking.bookingStatus === "APPROVED") {
        bottomActions.push({
            key: "checkin",
            label: "Check-in",
            color: "#16a34a",
            onPress: handleCheckIn,
        });
    }

    if (booking.bookingStatus === "CHECKED_IN") {
        bottomActions.push({
            key: "checkout",
            label: "Check-out",
            color: "#2563eb",
            onPress: handleCheckOut,
        });
    }

    const hasBottomActions = bottomActions.length > 0;

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            {/* Header */}
            <View
                style={{
                    height: 56,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    marginTop: 30,
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                }}
            >
                <Ionicons
                    name="chevron-back"
                    size={24}
                    color="#111"
                    onPress={() => navigation.goBack()}
                />
                <Text style={{ fontSize: 18, fontWeight: "700", flex: 1, marginLeft: 8 }}>
                    Chi tiết Booking
                </Text>
            </View>

            {/* Scrollable content */}
            <ScrollView
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: hasBottomActions ? 140 : 40,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Thông tin phòng */}
                <Card>
                    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                        {booking.property?.propertyType === "BUILDING" ? "Căn hộ" : "Phòng trọ"}: {booking.property?.title}
                    </Text>
                    <Text style={{marginBottom: 6 }}>
                        Địa chỉ: {formatAddress(booking.property?.address)}
                    </Text>

                    {/* Grid thông tin */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        <View style={{ width: "50%", marginBottom: 8 }}>
                            <Text style={{ fontWeight: "600" }}>Tầng:</Text>
                            <Text>{booking.property?.floorNo || "N/A"}</Text>
                        </View>
                        <View style={{ width: "50%", marginBottom: 8 }}>
                            <Text style={{ fontWeight: "600" }}>Diện tích:</Text>
                            <Text>
                                {booking.property?.area ? `${booking.property.area} m²` : "N/A"}
                            </Text>
                        </View>
                        <View style={{ width: "50%", marginBottom: 8 }}>
                            <Text style={{ fontWeight: "600" }}>Số người:</Text>
                            <Text>{booking.property?.capacity || "N/A"}</Text>
                        </View>
                    </View>

                    {/* Nội thất */}
                    {booking.property?.furnishings?.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ fontWeight: "600", marginBottom: 4 }}>Nội thất:</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {booking.property.furnishings.map((f, idx) => (
                                    <View key={idx} style={{ marginRight: 12, marginBottom: 6 }}>
                                        <Text>
                                            • {f.furnishingName}
                                            {f.quantity > 1 ? ` x${f.quantity}` : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Mô tả */}
                    {booking.property?.description && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ fontWeight: "600", marginBottom: 4 }}>Mô tả:</Text>
                            <Text style={{ color: "#444" }}>
                                {booking.property.description}
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Trạng thái booking */}
                <Card>
                    <Text style={{ color: TEXT }}>
                        Trạng thái:{" "}
                        <Text
                            style={{ fontWeight: "700", color: getBookingStatusColor(booking.bookingStatus) }}
                        >
                            {getBookingStatusLabel(booking.bookingStatus)}
                        </Text>
                    </Text>
                    <Text style={{ color: TEXT }}>
                        Check-in: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.startDate)}</Text>
                    </Text>
                    <Text style={{ color: TEXT }}>
                        Check-out: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.endDate)}</Text>
                    </Text>
                    {booking.note ? (
                        <Text style={{ marginTop: 6, color: TEXT }}>
                            Ghi chú: <Text style={{ fontStyle: "italic" }}>{booking.note}</Text>
                        </Text>
                    ) : null}
                    <Text style={{ color: TEXT }}>
                        Ngày tạo: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.createdAt)}</Text>
                    </Text>
                    {booking.paymentStatus ? (
                        <Text style={{ color: TEXT }}>
                            Thanh toán:{" "}
                            <Text
                                style={{
                                    fontWeight: "700",
                                    color: booking.paymentStatus === "PAID" ? "#16a34a" : TEXT,
                                }}
                            >
                                {getPaymentStatusLabel(booking.paymentStatus)}
                            </Text>
                        </Text>
                    ) : null}
                </Card>

                <Card>
                    <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6, color: TEXT }}>
                        Hợp đồng
                     </Text>
                 {contractLoading ? (
                        <View style={{ paddingVertical: 12, alignItems: "center" }}>
                            <ActivityIndicator size="small" color={ORANGE} />
                        </View>
                    ) : contract ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ flex: 1, paddingRight: 12 }}>
                                {contract?.contractCode ? (
                                    <Text style={{ color: TEXT }}>
                                        Mã hợp đồng: <Text style={{ fontWeight: "600" }}>{contract.contractCode}</Text>
                                    </Text>
                                ) : null}
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                                    <Text style={{ color: TEXT, marginRight: 8 }}>Trạng thái:</Text>
                                    <View
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            borderRadius: 999,
                                            backgroundColor: withAlpha(contractColor, 0.16),
                                        }}
                                    >
                                        <Text style={{ color: contractColor, fontWeight: "600" }}>
                                            {contractLabel}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleOpenContractPdf}
                                disabled={downloadingContract}
                                style={{
                                    backgroundColor: "#0d9488",
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    opacity: downloadingContract ? 0.7 : 1,
                                }}
                            >
                                {downloadingContract ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={18}
                                            color="#fff"
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={{ color: "#fff", fontWeight: "600" }}>Xem hợp đồng</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={{ color: "#6b7280" }}>
                            {contractError || "Chưa có hợp đồng cho booking này"}
                        </Text>
                    )}
                </Card>

                {/* Người thuê */}
                <Card>
                    <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                        Người thuê
                    </Text>
                    <Text>Họ tên: {booking.tenant?.fullName}</Text>
                    <Text>SĐT: {booking.tenant?.phoneNumber}</Text>
                    <Text>Email: {booking.tenant?.email}</Text>
                </Card>

                {/* Chủ nhà */}
                <Card>
                    <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                        Chủ nhà
                    </Text>
                    <Text>Họ tên: {booking.property?.landlord?.fullName}</Text>
                    <Text>SĐT: {booking.property?.landlord?.phoneNumber}</Text>
                </Card>

                {/* Chi phí */}
                <Card>
                    <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                        Chi phí
                    </Text>
                    <Text>
                        Giá:{" "}
                        {formatCurrency(booking.property?.price)}
                        {booking.property?.propertyType === "ROOM" ? "/tháng" : "/ngày"}
                    </Text>
                    <Text>Tổng tiền: {formatCurrency(booking.totalPrice)}</Text>
                </Card>

                {/* Nút thanh toán */}
                {booking.paymentStatus === "PENDING" && booking.paymentUrl && (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(booking.paymentUrl)}
                        style={btnStyle("#eab308")}
                    >
                        <Text style={{ color: "#fff", fontWeight: "600" }}>Thanh toán</Text>
                    </TouchableOpacity>
                )}

                </ScrollView>

                    {hasBottomActions && (
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        backgroundColor: "#fff",
                        borderTopWidth: 1,
                        borderTopColor: "#e5e7eb",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            alignItems: "center",
                            
                        }}
                    >
                        {bottomActions.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                onPress={action.onPress}
                                style={[
                                    btnStyle(action.color),
                                    { marginTop: 0, marginHorizontal: 8, marginBottom: 0, width: "100%" },
                                ]}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const Card = ({ children }) => (
    <View
        style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        }}
    >
        {children}
    </View>
);

const btnStyle = (bg) => ({
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: bg,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
});
