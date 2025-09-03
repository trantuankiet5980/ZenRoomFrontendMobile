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
        expiresAt: data?.expiresAt || null,
      };

      await SecureStore.setItemAsync('accessToken', token);
      await SecureStore.setItemAsync('userLogin', JSON.stringify(user));

      return { token, user };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login error';
      return rejectWithValue(msg);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('userLogin');
  return true;
});
