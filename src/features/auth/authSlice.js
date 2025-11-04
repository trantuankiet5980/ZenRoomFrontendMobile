import { createSlice } from '@reduxjs/toolkit';
import {
  loginThunk, loadSessionThunk, logoutThunk, changePasswordThunk,
  verifyOtpThunk, verifyResetOtpThunk, sendResetOtpThunk
} from './authThunks';

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  loadedSession: false,
  changePasswordLoading: false,
  changePasswordError: null,
  changePasswordSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetChangePasswordState: (state) => {
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
    },
  },
  extraReducers: (b) => {
    // loadSession
    b.addCase(loadSessionThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadSessionThunk.fulfilled, (s, a) => {
        s.loading = false; s.loadedSession = true;
        s.token = a.payload?.token || null;
        s.user = a.payload?.user || null;
      })
      .addCase(loadSessionThunk.rejected, (s) => {
        s.loading = false; s.loadedSession = true;
        s.token = null; s.user = null;
      });

    // login
    b.addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false; s.token = a.payload.token; s.user = a.payload.user;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false; s.error = a.payload || 'Đăng nhập thất bại';
      });

    // logout
    b.addCase(logoutThunk.fulfilled, (s) => { s.token = null; s.user = null; });

    // change password
    b.addCase(changePasswordThunk.pending, (s) => {
      s.changePasswordLoading = true; s.changePasswordError = null; s.changePasswordSuccess = false;
    })
      .addCase(changePasswordThunk.fulfilled, (s) => {
        s.changePasswordLoading = false; s.changePasswordSuccess = true;
      })
      .addCase(changePasswordThunk.rejected, (s, a) => {
        s.changePasswordLoading = false;
        s.changePasswordError = a.payload || 'Đổi mật khẩu thất bại';
        s.changePasswordSuccess = false;
      });

    // verifyOtp (register)
    b.addCase(verifyOtpThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verifyOtpThunk.fulfilled, (s) => { s.loading = false; })
      .addCase(verifyOtpThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // verifyResetOtp (reset password)
    b.addCase(verifyResetOtpThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verifyResetOtpThunk.fulfilled, (s) => { s.loading = false; })
      .addCase(verifyResetOtpThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // sendResetOtp
    b.addCase(sendResetOtpThunk.pending, (s) => { s.loading = true; })
      .addCase(sendResetOtpThunk.fulfilled, (s) => { s.loading = false; })
      .addCase(sendResetOtpThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export const { resetChangePasswordState } = authSlice.actions;
export default authSlice.reducer;