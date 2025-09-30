import { createSlice } from "@reduxjs/toolkit";
import {
  fetchContractByBooking,
  fetchContractById,
  createContract,
  updateContract,
  deleteContract,
} from "./contractThunks";

const contractSlice = createSlice({
  name: "contracts",
  initialState: {
    contracts: [],
    contractDetail: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearContractDetail: (state) => {
      state.contractDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contract by booking
      .addCase(fetchContractByBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractByBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.contractDetail = action.payload;
      })
      .addCase(fetchContractByBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by id
      .addCase(fetchContractById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.loading = false;
        state.contractDetail = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts.push(action.payload);
        state.contractDetail = action.payload;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateContract.fulfilled, (state, action) => {
        state.contractDetail = action.payload;
        state.contracts = state.contracts.map((c) =>
          c.contractId === action.payload.contractId ? action.payload : c
        );
      })

      // Delete
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.contracts = state.contracts.filter(
          (c) => c.contractId !== action.payload
        );
        if (state.contractDetail?.contractId === action.payload) {
          state.contractDetail = null;
        }
      });
  },
});

export const { clearContractDetail } = contractSlice.actions;
export const selectContracts = (state) => state.contracts.contracts;
export const selectContractDetail = (state) => state.contracts.contractDetail;
export const selectContractsLoading = (state) => state.contracts.loading;
export const selectContractsError = (state) => state.contracts.error;

export default contractSlice.reducer;
