import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../api/axiosInstance';
import * as SecureStore from 'expo-secure-store';

export const loadSessionThunk = createAsyncThunk('auth/loadSession', async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  const userStr = await SecureStore.getItemAsync('userLogin');
  return {
    token: token || null,
    user: userStr ? JSON.parse(userStr) : null, // { role, userId, expiresAt }
  };
});
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ phoneNumber, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/login', { phoneNumber, password });
      const data = res?.data || {};
      const token = data?.token;
      if (!token) throw new Error('MISSING_TOKEN');

      // gom user info để tiện dùng ở client
      const user = {
        role: data?.role || null,
        userId: data?.userId || null,
        fullName: data?.fullName || '',
        expiresAt: data?.expiresAt || null,
      };

      await SecureStore.setItemAsync('accessToken', token);
      await SecureStore.setItemAsync('userLogin', JSON.stringify(user));

      return { token, user };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Đăng nhập lỗi';
      return rejectWithValue(msg);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('userLogin');
  return true;
});


// API: Đăng ký tài khoản
export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ fullName, phoneNumber, password, roles }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/register', {
        fullName,
        phoneNumber,
        password,
        roles, 
      });
      return res.data; // { success, message, data }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại';
      return rejectWithValue(msg);
    }
  }
);

// API: Xác thực OTP
export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phoneNumber, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/verify-otp-sns', {
        phoneNumber,
        otp,
      });
      return res.data; // { success, message }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác thực OTP thất bại';
      return rejectWithValue(msg);
    }
  }
);