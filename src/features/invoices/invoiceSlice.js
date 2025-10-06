import { createSlice } from "@reduxjs/toolkit";
import { fetchInvoiceByBooking } from "./invoiceThunks";

const initialState = {
  currentInvoice: null,
  currentBookingId: null,
  loading: false,
  error: null,
  byBookingId: {},
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
      });
  },
});

export const { clearInvoice } = invoiceSlice.actions;

export const selectInvoiceLoading = (state) => state.invoices.loading;
export const selectInvoiceError = (state) => state.invoices.error;
export const selectCurrentInvoice = (state) => state.invoices.currentInvoice;
export const selectInvoiceBookingId = (state) => state.invoices.currentBookingId;
export const selectInvoicesByBookingId = (state) => state.invoices.byBookingId;

export default invoiceSlice.reducer;