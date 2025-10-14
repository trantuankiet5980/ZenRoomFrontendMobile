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
      formData.append("mediaType", "IMAGE");
      formData.append("firstAsCover", "true");
      formData.append("startOrder", "0");

      const res = await axiosInstance.post(
        `/properties/${propertyId}/media`,
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
      const normalizeUri = (uri) => {
        if (!uri) return uri;
        if (uri.startsWith("file://")) return uri;
        return `file://${uri}`;
      };

      const formData = new FormData();
      formData.append("files", {
        uri: video.uri,
        name: video.fileName || video.uri.split("/").pop() || "video.mp4",
        type: video.mimeType || "video/mp4",
      });


      formData.append("mediaType", "VIDEO");
      formData.append("firstAsCover", "false");
      formData.append("startOrder", "0");

      console.log("Upload video formData:", {
        propertyId,
        uri: normalizeUri(video.uri),
        size: video.fileSize,
        type: video.type,
      });

      const res = await axiosInstance.post(
        `/properties/${propertyId}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 60000,
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// Lấy danh sách media 
export const fetchPropertyMedia = createAsyncThunk(
  "propertyMedia/fetchMedia",
  async ({ propertyId, presign = false }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/properties/${propertyId}/media`, {
        params: { presign },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//Set media làm cover
export const makeMediaCover = createAsyncThunk(
  "propertyMedia/makeCover",
  async ({ propertyId, mediaId }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/properties/${propertyId}/media/${mediaId}/cover`);
      return mediaId; // trả về mediaId để update state
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//Xóa media 
export const removeMedia = createAsyncThunk(
  "propertyMedia/removeMedia",
  async ({ propertyId, mediaId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/properties/${propertyId}/media/${mediaId}`);
      return mediaId; // trả về mediaId để update state
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
