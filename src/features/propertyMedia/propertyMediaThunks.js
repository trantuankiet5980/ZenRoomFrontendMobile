import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from '../../api/axiosInstance';


// Upload ảnh
export const uploadPropertyImages = createAsyncThunk(
  "propertyMedia/uploadImages",
  async ({ propertyId, images }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      images.forEach((img, i) => {
        formData.append("files", {
          uri: img.uri,
          name: `image_${i}.jpg`,
          type: "image/jpeg",
        });
      });

      const res = await axiosInstance.post(
        `/properties/${propertyId}/media?mediaType=IMAGE&firstAsCover=true`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Upload video
export const uploadPropertyVideo = createAsyncThunk(
  "propertyMedia/uploadVideo",
  async ({ propertyId, video }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("files", {
        uri: video.uri,
        name: "video.mp4",
        type: "video/mp4",
      });

      const res = await axiosInstance.post(
        `/properties/${propertyId}/media?mediaType=VIDEO`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
