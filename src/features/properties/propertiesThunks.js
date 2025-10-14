import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";

export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
  async ({ page = 0, size = 20, type, postStatus, provinceCode, districtCode }) => {
    const params = { page, size, type, postStatus, provinceCode, districtCode };
    const response = await axiosInstance.get("/properties", { params });

    return {
      type,
      data: response.data.content
    };
  }
);


// Đăng phòng mới
export const createProperty = createAsyncThunk(
  "properties/createProperty",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/properties", {
        ...payload,
        services: payload.services || [],
      });
      console.log("createProperty response:", response.data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy chi tiết 1 property (room hoặc apartment)
export const fetchPropertyDetail = createAsyncThunk(
  "properties/fetchPropertyDetail",
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/properties/${propertyId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchPropertiesByLandlord = createAsyncThunk(
  "properties/fetchPropertiesByLandlord",
  async ({ page = 0, size = 20, type, postStatus, landlordId }) => {
    const params = { page, size, type, postStatus, landlordId };
    const response = await axiosInstance.get("/properties", { params });

    return {
      type,
      data: response.data.content,
      postStatus,
      totalElements: response.data.totalElements,
    };
  }
);

export const updateProperty = createAsyncThunk(
  "properties/updateProperty",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log("Updating property with ID:", id, "Payload:", data);
      const res = await axiosInstance.put(`/properties/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("Update property error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


export const searchProperties = createAsyncThunk(
  "properties/search",
  async (params, { rejectWithValue }) => {
    try {
      // lọc bỏ các giá trị undefined / null / ''
      const cleanParams = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          cleanParams[k] = v;
        }
      });

      const response = await axiosInstance.get("/properties/search", {
        params: cleanParams,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

