import { createSlice } from "@reduxjs/toolkit";
import {
  fetchInvoiceByBooking,
  fetchTenantInvoices,
  fetchTenantInvoiceDetail,
  fetchLandlordInvoices,
  fetchLandlordInvoiceDetail
} from "./invoiceThunks";

const initialState = {
  currentInvoice: null,
  currentBookingId: null,
  tenantInvoices: [],            // Danh sách hóa đơn của tenant
  pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
  tenantInvoiceDetail: null,     // Chi tiết hóa đơn cụ thể (khi xem riêng)
  loading: false,
  error: null,
  byBookingId: {},
  items: [],
  landlordInvoices: [],
  landlordInvoiceDetail: null,
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearInvoice(state) {
      state.currentInvoice = null;
      state.currentBookingId = null;
      state.loading = false;
      state.error = null;
    },
    clearTenantInvoices(state) {
      state.tenantInvoices = [];
      state.pagination = { page: 0, size: 20, totalElements: 0, totalPages: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceByBooking.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentInvoice = null;
        state.currentBookingId = action.meta.arg;
      })
      .addCase(fetchInvoiceByBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const bookingId =
          action.payload?.invoice?.bookingId || action.payload?.bookingId || null;
        const invoice = action.payload?.invoice || null;
        state.currentInvoice = invoice;
        state.currentBookingId = bookingId;
        if (bookingId) {
          state.byBookingId[bookingId] = invoice;
        }
      })
      .addCase(fetchInvoiceByBooking.rejected, (state, action) => {
        state.loading = false;
        state.currentInvoice = null;
        state.error = action.payload || action.error?.message || null;
        const bookingId = action.meta?.arg;
        if (bookingId) {
          state.byBookingId[bookingId] = null;
        }
      })
      // --- Lấy danh sách hóa đơn tenant (phân trang) ---
      .addCase(fetchTenantInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTenantInvoices.fulfilled, (state, action) => {
        state.loading = false;
        const allowedStatuses = new Set(["PAID", "REFUND_PENDING", "REFUNDED"]);
        const invoices = Array.isArray(action.payload) ? action.payload : [];
        const filtered = invoices.filter((invoice) =>
          allowedStatuses.has(invoice?.status)
        );
        state.items = filtered;
        state.tenantInvoices = filtered;
      })
      .addCase(fetchTenantInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Lấy chi tiết hóa đơn cụ thể ---
      .addCase(fetchTenantInvoiceDetail.pending, (state) => {
        state.loading = true;
        state.tenantInvoiceDetail = null;
        state.error = null;
      })
      .addCase(fetchTenantInvoiceDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.tenantInvoiceDetail = action.payload;
        state.error = null;
      })
      .addCase(fetchTenantInvoiceDetail.rejected, (state, action) => {
        state.loading = false;
        state.tenantInvoiceDetail = null;
        state.error = action.payload?.message || action.payload || "Không thể tải chi tiết hóa đơn";
      })
      .addCase(fetchLandlordInvoices.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 0) {
          state.landlordInvoices = action.payload.content;
        } else {
          state.landlordInvoices = [...state.landlordInvoices, ...action.payload.content];
        }
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchLandlordInvoices.pending, (state, action) => {
        state.loading = action.meta.arg.page > 0 ? state.landlordInvoices.length > 0 : true;
      })
      .addCase(fetchLandlordInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
        state.error = action.payload || "Lỗi tải chi tiết hóa đơn";
      });
  },
});

export const { clearInvoice, clearTenantInvoices } = invoiceSlice.actions;

export const selectInvoiceLoading = (state) => state.invoices.loading;
export const selectInvoiceError = (state) => state.invoices.error;
export const selectCurrentInvoice = (state) => state.invoices.currentInvoice;
export const selectInvoiceBookingId = (state) => state.invoices.currentBookingId;
export const selectInvoicesByBookingId = (state) => state.invoices.byBookingId;
export const selectTenantInvoices = (state) => state.invoices.tenantInvoices;
export const selectTenantPagination = (state) => state.invoices.pagination;
export const selectTenantInvoiceDetail = (state) =>
  state.invoices.tenantInvoiceDetail;
export const selectLandlordInvoiceDetail = (state) => state.invoices.landlordInvoiceDetail;
export default invoiceSlice.reducer;