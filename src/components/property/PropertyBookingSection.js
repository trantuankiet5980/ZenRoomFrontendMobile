import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import CalendarPicker from "../CalendarPicker";
import {
    createBooking,
    fetchPropertyBookedDates,
} from "../../features/bookings/bookingsThunks";

const ORANGE = "#f36031";

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
    if (!value) {
        return "--";
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("vi-VN");
};

const toLocalISOStringFromKey = (key) => {
    if (!key) {
        return null;
    }

    const date = new Date(`${key}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
};

const PropertyBookingSection = ({ propertyId, style, onLayout }) => {
    const dispatch = useDispatch();
    const [selectedStart, setSelectedStart] = useState(null);
    const [selectedEnd, setSelectedEnd] = useState(null);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const bookedDates = useSelector(
        (state) => state.bookings.propertyBookedDates?.[propertyId] || []
    );
    const status = useSelector(
        (state) => state.bookings.propertyBookedStatus?.[propertyId] || "idle"
    );
    const error = useSelector(
        (state) => state.bookings.propertyBookedError?.[propertyId] || null
    );

    useEffect(() => {
        if (!propertyId) {
            return;
        }
        dispatch(fetchPropertyBookedDates(propertyId));
    }, [dispatch, propertyId]);

    useEffect(() => {
        setSelectedStart(null);
        setSelectedEnd(null);
        setNote("");
    }, [propertyId]);

    const bookedDatesSet = useMemo(() => {
        return new Set(
            bookedDates
                .map((date) =>
                    typeof date === "string" && date.length >= 10
                        ? date.slice(0, 10)
                        : null
                )
                .filter(Boolean)
        );
    }, [bookedDates]);

    const nights = useMemo(() => {
        if (!selectedStart || !selectedEnd) {
            return 0;
        }
        const startDate = new Date(`${selectedStart}T00:00:00`);
        const endDate = new Date(`${selectedEnd}T00:00:00`);
        const diff = endDate - startDate;
        if (Number.isNaN(diff) || diff <= 0) {
            return 0;
        }
        return Math.round(diff / (1000 * 60 * 60 * 24));
    }, [selectedStart, selectedEnd]);

    const hasBookedBetween = useCallback(
        (startKey, endKey) => {
            if (!startKey || !endKey) {
                return false;
            }

            const startDate = new Date(`${startKey}T00:00:00`);
            const endDate = new Date(`${endKey}T00:00:00`);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime()) ||
                endDate <= startDate
            ) {
                return false;
            }

            const cursor = new Date(startDate.getTime());
            cursor.setDate(cursor.getDate() + 1);

            while (cursor < endDate) {
                if (bookedDatesSet.has(formatDateKey(cursor))) {
                    return true;
                }
                cursor.setDate(cursor.getDate() + 1);
            }

            return false;
        },
        [bookedDatesSet]
    );

    const resetSelection = useCallback(() => {
        setSelectedStart(null);
        setSelectedEnd(null);
        setNote("");
    }, []);

    const handleSelectDate = useCallback(
        (dateKey) => {
            if (!dateKey || bookedDatesSet.has(dateKey)) {
                return;
            }

            if (selectedStart && selectedEnd) {
                setSelectedStart(dateKey);
                setSelectedEnd(null);
                return;
            }

            if (selectedStart && !selectedEnd) {
                if (dateKey <= selectedStart) {
                    setSelectedStart(dateKey);
                    return;
                }

                if (hasBookedBetween(selectedStart, dateKey)) {
                    Alert.alert(
                        "Không thể chọn",
                        "Khoảng thời gian này đã có lượt đặt phòng."
                    );
                    return;
                }

                setSelectedEnd(dateKey);
                return;
            }

            setSelectedStart(dateKey);
        },
        [bookedDatesSet, hasBookedBetween, selectedEnd, selectedStart]
    );

    const handleSubmit = useCallback(async () => {
        if (!propertyId || !selectedStart || !selectedEnd) {
            return;
        }

        const startDate = new Date(`${selectedStart}T00:00:00`);
        const endDate = new Date(`${selectedEnd}T00:00:00`);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            Alert.alert("Lỗi", "Không thể xử lý ngày đã chọn.");
            return;
        }

        if (endDate <= startDate) {
            Alert.alert(
                "Thông tin chưa hợp lệ",
                "Ngày trả phòng phải sau ngày nhận phòng."
            );
            return;
        }

        const checkInAt = toLocalISOStringFromKey(selectedStart);
        const checkOutAt = toLocalISOStringFromKey(selectedEnd);

        if (!checkInAt || !checkOutAt) {
            Alert.alert("Lỗi", "Không thể chuyển đổi dữ liệu ngày giờ.");
            return;
        }

        setSubmitting(true);
        try {
            await dispatch(
                createBooking({
                    propertyId,
                    checkInAt,
                    checkOutAt,
                    note,
                })
            ).unwrap();

            Alert.alert("Thành công", "Đặt phòng thành công!");
            resetSelection();
            dispatch(fetchPropertyBookedDates(propertyId));
        } catch (err) {
            let message = "Đặt phòng thất bại. Vui lòng thử lại.";
            if (typeof err === "string") {
                message = err;
            } else if (err?.message) {
                message = err.message;
            } else if (err?.data?.message) {
                message = err.data.message;
            }
            Alert.alert("Lỗi", message);
        } finally {
            setSubmitting(false);
        }
    }, [dispatch, note, propertyId, resetSelection, selectedEnd, selectedStart]);

    return (
        <View style={[styles.container, style]} onLayout={onLayout}>
            <Text style={styles.sectionTitle}>Chọn ngày nhận phòng</Text>
            <Text style={styles.sectionSubtitle}>
                Những ngày có dấu chấm đỏ đã có khách đặt.
            </Text>

            {status === "loading" ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={ORANGE} />
                </View>
            ) : (
                <CalendarPicker
                    bookedDates={bookedDates}
                    selectedStart={selectedStart}
                    selectedEnd={selectedEnd}
                    onSelectDate={handleSelectDate}
                    focusDate={selectedStart || selectedEnd}
                />
            )}

            {error ? (
                <Text style={styles.errorText}>
                    {typeof error === "string"
                        ? error
                        : "Không thể tải thông tin lịch đặt phòng."}
                </Text>
            ) : null}

            <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Nhận phòng</Text>
                    <Text style={styles.infoValue}>
                        {formatDisplayDate(selectedStart)}
                    </Text>
                </View>
                <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Trả phòng</Text>
                    <Text style={styles.infoValue}>
                        {formatDisplayDate(selectedEnd)}
                    </Text>
                </View>
            </View>

            <Text style={styles.nightsText}>
                {nights > 0
                    ? `${nights} đêm lưu trú`
                    : "Chọn khoảng ngày để tiếp tục"}
            </Text>

            <Text style={styles.label}>Ghi chú cho chủ nhà</Text>
            <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Ví dụ: đi 2 người, dự kiến check-in lúc 19h..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[
                    styles.submitButton,
                    (!selectedStart || !selectedEnd || submitting) &&
                        styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedStart || !selectedEnd || submitting}
                activeOpacity={0.8}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Xác nhận đặt phòng</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#ddd",
        padding: 16,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 12,
    },
    loadingContainer: {
        paddingVertical: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        color: "#d9534f",
        marginTop: 8,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    infoColumn: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    nightsText: {
        textAlign: "center",
        marginTop: 8,
        fontSize: 14,
        color: "#374151",
    },
    label: {
        marginTop: 16,
        marginBottom: 6,
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#d1d5db",
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        backgroundColor: "#f9fafb",
    },
    submitButton: {
        marginTop: 16,
        borderRadius: 12,
        backgroundColor: ORANGE,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#f8b79c",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default PropertyBookingSection;