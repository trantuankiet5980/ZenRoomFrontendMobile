import { createSlice } from "@reduxjs/toolkit";
import {
  fetchInvoiceByBooking,
  fetchTenantInvoices,
  fetchTenantInvoiceDetail,
  fetchLandlordInvoices,
  fetchLandlordInvoiceDetail,
  fetchLandlordDailyRevenue,
  fetchLandlordMonthlyRevenue,
  fetchLandlordYearlyRevenue,
} from "./invoiceThunks";

const emptyRevenueBucket = () => ({ summary: null, breakdown: [] });

const normalizeRevenuePayload = (payload) => {
  if (!payload) return emptyRevenueBucket();

  if (Array.isArray(payload)) {
    const totalLandlordReceivable = payload.reduce(
      (sum, item) => sum + (Number(item.netRevenue || item.landlordReceivable || 0) || 0),
      0
    );
    const totalPlatformFee = payload.reduce(
      (sum, item) => sum + (Number(item.platformFee || 0) || 0),
      0
    );

    return {
      summary: { totalLandlordReceivable, totalPlatformFee },
      breakdown: payload,
    };
  }

  const breakdown =
    payload.dailyBreakdown?.length
      ? payload.dailyBreakdown
      : payload.monthlyBreakdown?.length
        ? payload.monthlyBreakdown
        : payload.yearlyBreakdown?.length
          ? payload.yearlyBreakdown
          : payload.bookings ?? [];

  const summary = {
    totalLandlordReceivable: Number(payload.totalLandlordReceivable || payload.totalNetRevenue || 0) || 0,
    totalPlatformFee: Number(payload.totalPlatformFee || 0) || 0,
    period: payload.period,
    year: payload.year,
    month: payload.month,
    day: payload.day,
  };

  return { summary, breakdown };
};

const initialState = {
  // Hóa đơn hiện tại (theo booking)
  currentInvoice: null,
  currentBookingId: null,
  byBookingId: {},

  // Danh sách hóa đơn
  tenantInvoices: [],
  landlordInvoices: [],
  items: [],

  // Chi tiết hóa đơn
  tenantInvoiceDetail: null,
  landlordInvoiceDetail: null,

  // Phân trang
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },

  // Thống kê doanh thu (mới thêm)
  revenueStats: {
    daily: emptyRevenueBucket(),
    monthly: emptyRevenueBucket(),
    yearly: emptyRevenueBucket(),
  },

  // Trạng thái chung
  loading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearInvoice(state) {
      state.currentInvoice = null;
      state.currentBookingId = null;
      state.error = null;
    },
    clearTenantInvoices(state) {
      state.tenantInvoices = [];
      state.items = [];
      state.pagination = { page: 0, size: 20, totalElements: 0, totalPages: 0 };
    },
    clearRevenueStats(state) {
      state.revenueStats = {
        daily: emptyRevenueBucket(),
        monthly: emptyRevenueBucket(),
        yearly: emptyRevenueBucket(),
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // === LẤY HÓA ĐƠN THEO BOOKING ===
      .addCase(fetchInvoiceByBooking.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentInvoice = null;
        state.currentBookingId = action.meta.arg;
      })
      .addCase(fetchInvoiceByBooking.fulfilled, (state, action) => {
        state.loading = false;
        const { bookingId, invoice } = action.payload;
        state.currentInvoice = invoice;
        state.currentBookingId = bookingId;
        if (bookingId && invoice) {
          state.byBookingId[bookingId] = invoice;
        }
      })
      .addCase(fetchInvoiceByBooking.rejected, (state, action) => {
        state.loading = false;
        state.currentInvoice = null;
        state.error = action.payload;
        const bookingId = action.meta.arg;
        if (bookingId) {
          state.byBookingId[bookingId] = null;
        }
      })

      // === DANH SÁCH HÓA ĐƠN CỦA TENANT (PHÂN TRANG) ===
      .addCase(fetchTenantInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTenantInvoices.fulfilled, (state, action) => {
        state.loading = false;
        const invoices = Array.isArray(action.payload) ? action.payload : action.payload.content || [];
        const allowedStatuses = new Set(["PAID", "REFUND_PENDING", "REFUNDED"]);
        const filtered = invoices.filter((i) => allowedStatuses.has(i.status));
        state.tenantInvoices = filtered;
        state.items = filtered;
      })
      .addCase(fetchTenantInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // === CHI TIẾT HÓA ĐƠN CỦA TENANT ===
      .addCase(fetchTenantInvoiceDetail.pending, (state) => {
        state.loading = true;
        state.tenantInvoiceDetail = null;
        state.error = null;
      })
      .addCase(fetchTenantInvoiceDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.tenantInvoiceDetail = action.payload;
      })
      .addCase(fetchTenantInvoiceDetail.rejected, (state, action) => {
        state.loading = false;
        state.tenantInvoiceDetail = null;
        state.error = action.payload;
      })

      // === DANH SÁCH HÓA ĐƠN CỦA LANDLORD (PHÂN TRANG) ===
      .addCase(fetchLandlordInvoices.pending, (state, action) => {
        state.loading = action.meta.arg.page > 0 ? state.landlordInvoices.length > 0 : true;
      })
      .addCase(fetchLandlordInvoices.fulfilled, (state, action) => {
        state.loading = false;
        const { content, page, size, totalElements, totalPages } = action.payload;
        if (action.meta.arg.page === 0) {
          state.landlordInvoices = content;
        } else {
          state.landlordInvoices = [...state.landlordInvoices, ...content];
        }
        state.pagination = { page, size, totalElements, totalPages };
      })
      .addCase(fetchLandlordInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // === CHI TIẾT HÓA ĐƠN CỦA LANDLORD ===
      .addCase(fetchLandlordInvoiceDetail.pending, (state) => {
        state.loading = true;
        state.landlordInvoiceDetail = null;
        state.error = null;
      })
      .addCase(fetchLandlordInvoiceDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.landlordInvoiceDetail = action.payload;
      })
      .addCase(fetchLandlordInvoiceDetail.rejected, (state, action) => {
        state.loading = false;
        state.landlordInvoiceDetail = null;
        state.error = action.payload;
      })

      // === THỐNG KÊ DOANH THU THEO NGÀY ===
      .addCase(fetchLandlordDailyRevenue.pending, (state) => {
        state.loading = true;
        state.revenueStats.daily = emptyRevenueBucket();
        state.error = null;
      })
      .addCase(fetchLandlordDailyRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats.daily = normalizeRevenuePayload(action.payload);
      })
      .addCase(fetchLandlordDailyRevenue.rejected, (state, action) => {
        state.loading = false;
        state.revenueStats.daily = emptyRevenueBucket();
        state.error = action.payload;
      })

      // === THỐNG KÊ DOANH THU THEO THÁNG ===
      .addCase(fetchLandlordMonthlyRevenue.pending, (state) => {
        state.loading = true;
        state.revenueStats.monthly = emptyRevenueBucket();
        state.error = null;
      })
      .addCase(fetchLandlordMonthlyRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats.monthly = normalizeRevenuePayload(action.payload);
      })
      .addCase(fetchLandlordMonthlyRevenue.rejected, (state, action) => {
        state.loading = false;
        state.revenueStats.monthly = emptyRevenueBucket();
        state.error = action.payload;
      })

      // === THỐNG KÊ DOANH THU THEO NĂM ===
      .addCase(fetchLandlordYearlyRevenue.pending, (state) => {
        state.loading = true;
        state.revenueStats.yearly = emptyRevenueBucket();
        state.error = null;
      })
      .addCase(fetchLandlordYearlyRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats.yearly = normalizeRevenuePayload(action.payload);
      })
      .addCase(fetchLandlordYearlyRevenue.rejected, (state, action) => {
        state.loading = false;
        state.revenueStats.yearly = emptyRevenueBucket();
        state.error = action.payload;
      });
  },
});

// === ACTIONS ===
export const {
  clearInvoice,
  clearTenantInvoices,
  clearRevenueStats,
} = invoiceSlice.actions;

// === SELECTORS ===
export const selectInvoiceLoading = (state) => state.invoices.loading;
export const selectInvoiceError = (state) => state.invoices.error;

export const selectCurrentInvoice = (state) => state.invoices.currentInvoice;
export const selectInvoiceBookingId = (state) => state.invoices.currentBookingId;
export const selectInvoicesByBookingId = (state) => state.invoices.byBookingId;

export const selectTenantInvoices = (state) => state.invoices.tenantInvoices;
export const selectTenantPagination = (state) => state.invoices.pagination;
export const selectTenantInvoiceDetail = (state) => state.invoices.tenantInvoiceDetail;

export const selectLandlordInvoices = (state) => state.invoices.landlordInvoices;
export const selectLandlordInvoiceDetail = (state) => state.invoices.landlordInvoiceDetail;

export const selectLandlordRevenueStats = (state) => state.invoices.revenueStats;
export const selectDailyRevenue = (state) => state.invoices.revenueStats.daily;
export const selectMonthlyRevenue = (state) => state.invoices.revenueStats.monthly;
export const selectYearlyRevenue = (state) => state.invoices.revenueStats.yearly;

export default invoiceSlice.reducer;