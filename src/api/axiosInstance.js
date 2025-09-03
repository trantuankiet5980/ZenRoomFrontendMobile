import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { navigationRef } from '../navigation/NavigationService';
import { showToast } from '../utils/AppUtils';

const API_URL = Constants.expoConfig?.extra?.API_URL || '';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let accessTokenCache = null;

const goAuthOnce = (() => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    showToast('info', 'top', 'Thông báo', 'Phiên đăng nhập đã hết.');
    navigationRef.current?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    setTimeout(() => (done = false), 1000);
  };
})();

axiosInstance.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  if (!accessTokenCache) {
    accessTokenCache = await SecureStore.getItemAsync('accessToken');
  }
  if (accessTokenCache) {
    config.headers.Authorization = `Bearer ${accessTokenCache}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    // lỗi mạng không có response
    if (!error?.response) return Promise.reject(error);

    const status = error.response.status;

    if (status === 401 || status === 403) {
      accessTokenCache = null;
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('userLogin'); // lưu role/userId
      goAuthOnce();
    }
    return Promise.reject(error);
  }
);