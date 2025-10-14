import { createSlice } from "@reduxjs/toolkit";
import { fetchProvinces, fetchDistricts, fetchWards } from "./administrativeThunks";

const administrativeSlice = createSlice({
  name: "administrative",
  initialState: {
    provinces: [],
    districts: [],
    wards: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDistricts: (state) => { state.districts = []; },
    clearWards: (state) => { state.wards = []; },
  },
  extraReducers: (builder) => {
    builder
      // Provinces
      .addCase(fetchProvinces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProvinces.fulfilled, (state, action) => {
        state.loading = false;
        state.provinces = action.payload;
      })
      .addCase(fetchProvinces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Districts
      .addCase(fetchDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action) => {
        state.loading = false;
        state.districts = action.payload;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Wards
      .addCase(fetchWards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.loading = false;
        state.wards = action.payload;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDistricts, clearWards } = administrativeSlice.actions;
export default administrativeSlice.reducer;
