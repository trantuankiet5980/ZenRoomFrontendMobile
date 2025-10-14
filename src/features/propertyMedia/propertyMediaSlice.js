import { createSlice } from "@reduxjs/toolkit";
import {
  uploadPropertyImages,
  uploadPropertyVideo,
  fetchPropertyMedia,
  makeMediaCover,
  removeMedia,
} from "./propertyMediaThunks";

const propertyMediaSlice = createSlice({
  name: "propertyMedia",
  initialState: {
    uploading: false,
    error: null,
    uploaded: [],
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
      // Upload Images 
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
      //Upload Video
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
      })
      // Fetch Media
      .addCase(fetchPropertyMedia.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(fetchPropertyMedia.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploaded = action.payload;
      })
      .addCase(fetchPropertyMedia.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      //Set Cover
      .addCase(makeMediaCover.fulfilled, (state, action) => {
        const mediaId = action.payload;
        state.uploaded = state.uploaded.map((m) => ({
          ...m,
          cover: m.id === mediaId,
        }));
      })
      // Delete Media
      .addCase(removeMedia.fulfilled, (state, action) => {
        const mediaId = action.payload;
        state.uploaded = state.uploaded.filter((m) => m.id !== mediaId);
      });
  },
});

export const { clearMediaState } = propertyMediaSlice.actions;
export default propertyMediaSlice.reducer;
