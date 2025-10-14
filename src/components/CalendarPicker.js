import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ORANGE = "#f36031";
const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateString = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  return value.slice(0, 10);
};

const buildCalendarMatrix = (displayDate) => {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const matrix = [];
  let currentDay = 1;
  let nextMonthDay = 1;

  for (let week = 0; week < 6; week += 1) {
    const weekRow = [];

    for (let dow = 0; dow < 7; dow += 1) {
      let date;
      let inCurrentMonth = true;

      if (week === 0 && dow < firstWeekday) {
        const dayNumber = daysInPrevMonth - firstWeekday + dow + 1;
        date = new Date(year, month - 1, dayNumber);
        inCurrentMonth = false;
      } else if (currentDay > daysInMonth) {
        date = new Date(year, month + 1, nextMonthDay);
        nextMonthDay += 1;
        inCurrentMonth = false;
      } else {
        date = new Date(year, month, currentDay);
        currentDay += 1;
      }

      weekRow.push({
        date,
        inCurrentMonth,
        key: formatDateKey(date),
      });
    }

    matrix.push(weekRow);
  }

  return matrix;
};

const CalendarPicker = ({
  bookedDates = [],
  selectedStart,
  selectedEnd,
  onSelectDate,
  focusDate,
  highlightColor = ORANGE,
  style,
}) => {
  const bookedSet = useMemo(() => {
    const normalized = bookedDates
      .map(normalizeDateString)
      .filter(Boolean);
    return new Set(normalized);
  }, [bookedDates]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (focusDate) {
      const parsed = new Date(`${focusDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    if (!focusDate) {
      return;
    }
    const parsed = new Date(`${focusDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [focusDate]);

  const calendarMatrix = useMemo(
    () => buildCalendarMatrix(currentMonth),
    [currentMonth]
  );

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return next;
    });
  };

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      {calendarMatrix.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.daysRow}>
          {week.map(({ date, inCurrentMonth, key }) => {
            const dateKey = key;
            const isBooked = bookedSet.has(dateKey);
            const isToday = formatDateKey(today) === dateKey;
            const isPast = startOfDay(date) < today;
            const isStart = selectedStart === dateKey;
            const isEnd = selectedEnd === dateKey;
            const isBetween =
              selectedStart &&
              selectedEnd &&
              dateKey > selectedStart &&
              dateKey < selectedEnd;

            const disabled = isBooked || !inCurrentMonth || isPast;

            const dayStyles = [styles.dayButton];
            const textStyles = [styles.dayText];

            if (!inCurrentMonth) {
              textStyles.push(styles.dayTextFaded);
            }

            if (disabled) {
              textStyles.push(styles.dayTextDisabled);
            }

            if (isBetween) {
              dayStyles.push({ backgroundColor: "#fde6dc" });
            }

            if (isStart || isEnd) {
              dayStyles.push({ backgroundColor: highlightColor });
              textStyles.push(styles.dayTextSelected);
            }

            if (isToday && !isStart && !isEnd && !isBetween) {
              dayStyles.push(styles.todayOutline);
            }

            return (
              <TouchableOpacity
                key={dateKey}
                style={styles.dayCell}
                onPress={() => onSelectDate?.(dateKey)}
                disabled={disabled}
                activeOpacity={0.8}
              >
                <View style={dayStyles}>
                  <Text style={textStyles}>{date.getDate()}</Text>
                  {isBooked && <View style={styles.bookedDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  navText: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "#6b7280",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    marginVertical: 6,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  dayTextFaded: {
    color: "#d1d5db",
  },
  dayTextDisabled: {
    color: "#d1d5db",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  todayOutline: {
    borderWidth: 1,
    borderColor: ORANGE,
  },
  bookedDot: {
    position: "absolute",
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
});

export default CalendarPicker;