import { createSlice } from "@reduxjs/toolkit";
import { uploadPropertyImages, uploadPropertyVideo } from "./propertyMediaThunks";

const propertyMediaSlice = createSlice({
  name: "propertyMedia",
  initialState: {
    uploading: false,
    error: null,
    uploaded: [], // media đã upload
  },
  reducers: {
    clearMediaState: (state) => {
      state.uploading = false;
      state.error = null;
      state.uploaded = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // IMAGE
      .addCase(uploadPropertyImages.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadPropertyImages.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploaded = [...state.uploaded, ...action.payload];
      })
      .addCase(uploadPropertyImages.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // VIDEO
      .addCase(uploadPropertyVideo.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadPropertyVideo.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploaded = [...state.uploaded, ...action.payload];
      })
      .addCase(uploadPropertyVideo.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMediaState } = propertyMediaSlice.actions;
export default propertyMediaSlice.reducer;
