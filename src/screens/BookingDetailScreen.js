import React, { useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Linking,
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
import { useRoute, useNavigation } from "@react-navigation/native";

const ORANGE = "#f36031";

function formatDateVN(dateString) {
    if (!dateString) return "";
    let safeDate = dateString;
    if (!dateString.includes("Z") && !dateString.includes("+")) {
        safeDate = dateString + "Z";
    }
    const d = new Date(safeDate);
    if (isNaN(d)) return "";
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(value) {
    if (value == null) return "";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
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



function statusColor(status) {
    switch (status) {
        case "PENDING":
            return "#f59e0b";
        case "APPROVED":
            return "#16a34a";
        case "REJECTED":
            return "#dc2626";
        case "CANCELLED":
            return "#6b7280";
        case "CHECKED_IN":
            return "#2563eb";
        case "COMPLETED":
            return "#0d9488";
        default:
            return "#374151";
    }
}

export default function BookingDetailScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;

    const booking = useSelector(selectBookingDetail);
    const loading = useSelector(selectBookingsLoading);

    useEffect(() => {
        if (id) {
            dispatch(fetchBookingById(id));
        }
    }, [dispatch, id]);

    const handleCancel = async () => {
        try {
            await dispatch(cancelBooking(id)).unwrap();
            alert("Hủy booking thành công");
            navigation.goBack();
        } catch (err) {
            alert(err?.message || "Hủy booking thất bại");
        }
    };

    const handleCheckIn = async () => {
        try {
            await dispatch(checkInBooking(id)).unwrap();
            alert("Check-in thành công");
        } catch (err) {
            alert(err?.message || "Check-in thất bại");
        }
    };

    const handleCheckOut = async () => {
        try {
            await dispatch(checkOutBooking(id)).unwrap();
            alert("Check-out thành công");
        } catch (err) {
            alert(err?.message || "Check-out thất bại");
        }
    };

    if (loading || !booking) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={ORANGE} />
            </View>
        );
    }

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
                    paddingBottom: 40,
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
                        <View style={{ width: "50%", marginBottom: 8 }}>
                            <Text style={{ fontWeight: "600" }}>Đặt cọc:</Text>
                            <Text>
                                {booking.property?.deposit
                                    ? formatCurrency(booking.property.deposit)
                                    : "Thỏa thuận"}
                            </Text>
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
                    <Text>
                        Trạng thái:{" "}
                        <Text style={{ fontWeight: "700", color: statusColor(booking.bookingStatus) }}>
                            {booking.bookingStatus}
                        </Text>
                    </Text>
                    <Text>
                        Check-in: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.startDate)}</Text>
                    </Text>
                    <Text>
                        Check-out: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.endDate)}</Text>
                    </Text>
                    {booking.note ? (
                        <Text style={{ marginTop: 6 }}>
                            Ghi chú: <Text style={{ fontStyle: "italic" }}>{booking.note}</Text>
                        </Text>
                    ) : null}
                    <Text>
                        Ngày tạo: <Text style={{ fontWeight: "600" }}>{formatDateVN(booking.createdAt)}</Text>
                    </Text>
                    <Text>
                        Thanh toán: <Text style={{ fontWeight: "700" }}>{booking.paymentStatus}</Text>
                    </Text>
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
                    {booking.depositAmount ? (
                        <Text>Đặt cọc: {formatCurrency(booking.depositAmount)}</Text>
                    ) : null}
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

                {/* Action buttons */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10 }}>
                    {booking.bookingStatus === "PENDING" && (
                        <TouchableOpacity onPress={handleCancel} style={btnStyle(ORANGE)}>
                            <Text style={{ color: "#fff", fontWeight: "600" }}>Hủy</Text>
                        </TouchableOpacity>
                    )}

                    {booking.bookingStatus === "APPROVED" && (
                        <>
                            <TouchableOpacity onPress={handleCheckIn} style={btnStyle("#16a34a")}>
                                <Text style={{ color: "#fff", fontWeight: "600" }}>Check-in</Text>
                            </TouchableOpacity>

                            {/* Nút xem hợp đồng */}
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate("ContractDetailScreen", {
                                        contract: booking.contract,
                                    })
                                }
                                style={btnStyle("#0d9488")}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>Xem hợp đồng</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {booking.bookingStatus === "CHECKED_IN" && (
                        <TouchableOpacity onPress={handleCheckOut} style={btnStyle("#2563eb")}>
                            <Text style={{ color: "#fff", fontWeight: "600" }}>Check-out</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
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
