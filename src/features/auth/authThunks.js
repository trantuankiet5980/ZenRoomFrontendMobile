import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance, setAccessTokenCache, clearAccessTokenCache } from '../../api/axiosInstance';
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
        phoneNumber: data?.phoneNumber || '',
        expiresAt: data?.expiresAt || null,
      };

      await SecureStore.setItemAsync('accessToken', token);
      await SecureStore.setItemAsync('userLogin', JSON.stringify(user));

      setAccessTokenCache(token);

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
  clearAccessTokenCache();
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
      return res.data;
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
      return res.data; 
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác thực OTP thất bại';
      return rejectWithValue(msg);
    }
  }
);

// Gửi OTP để reset password
export const sendResetOtpThunk = createAsyncThunk(
  'auth/sendResetOtp',
  async ({ phoneNumber }, { rejectWithValue }) => {
    try {
      console.log('Gửi OTP cho số:', phoneNumber);
      const res = await axiosInstance.post('/auth/send-reset-otp', { phoneNumber });
      console.log('Response từ server:', res.data);
      return res.data;
    } catch (err) {
      console.error('Lỗi gửi OTP:', err.response?.data || err.message);
      const msg = err?.response?.data?.message || 'Gửi OTP thất bại';
      return rejectWithValue(msg);
    }
  }
);


// Reset mật khẩu
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async ({ phoneNumber, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/reset-password', { phoneNumber, newPassword });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Reset mật khẩu thất bại';
      return rejectWithValue(msg);
    }
  }
);

export const changePasswordThunk = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
      return res.data; 
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đổi mật khẩu thất bại';
      return rejectWithValue(msg);
    }
  }
);

// API: Xác thực OTP cho reset password
export const verifyResetOtpThunk = createAsyncThunk(
  'auth/verifyResetOtp',
  async ({ phoneNumber, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/verify-reset-otp', {
        phoneNumber,
        otp,
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác thực OTP thất bại';
      return rejectWithValue(msg);
    }
  }
);