import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/axiosInstance";
import { mapReportReasonCodes } from "../../constants/reportReasons";

export const fetchReportReasonsThunk = createAsyncThunk(
    "reports/fetchReasons",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/enums/report-reasons");
            const data = response?.data;
            const codes = Array.isArray(data) ? data : data?.data;
            const reasons = mapReportReasonCodes(Array.isArray(codes) ? codes : []);
            return reasons;
        } catch (error) {
            const payload = error?.response?.data || error?.message || "Không thể tải danh sách lý do báo cáo";
            return rejectWithValue(payload);
        }
    }
);

export const submitPropertyReportThunk = createAsyncThunk(
    "reports/submitReport",
    async (payload, { rejectWithValue }) => {
        try {
            const { propertyId, reason, description } = payload || {};
            const requestBody = {
                propertyId,
                reason,
            };

            if (description && String(description).trim().length > 0) {
                requestBody.description = String(description).trim();
            }

            const response = await axiosInstance.post("/reports", requestBody);
            return response?.data;
        } catch (error) {
            const payload = error?.response?.data || error?.message || "Không thể gửi báo cáo";
            return rejectWithValue(payload);
        }
    }
);