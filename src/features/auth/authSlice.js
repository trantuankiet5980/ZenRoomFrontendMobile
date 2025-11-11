import { createSlice } from '@reduxjs/toolkit';
import {
  loginThunk, loadSessionThunk, logoutThunk, changePasswordThunk,
  registerThunk, verifyOtpThunk, sendResetOtpThunk, verifyResetOtpThunk
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
  registerSuccess: false,
  verifyOtpSuccess: false,
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
    resetRegisterState: (state) => {
      state.registerSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (b) => {
    // loadSession
    b.addCase(loadSessionThunk.pending, (s) => { s.loading = true; })
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
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });

    // logout
    b.addCase(logoutThunk.fulfilled, (s) => {
      s.token = null; s.user = null;
    });

    // REGISTER
    b.addCase(registerThunk.pending, (s) => { s.loading = true; s.error = null; s.registerSuccess = false; })
      .addCase(registerThunk.fulfilled, (s) => {
        s.loading = false;
        s.registerSuccess = true;
      })
      .addCase(registerThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        s.registerSuccess = false;
      });

    // VERIFY OTP
    b.addCase(verifyOtpThunk.pending, (s) => { s.loading = true; s.error = null; s.verifyOtpSuccess = false; })
      .addCase(verifyOtpThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
        s.verifyOtpSuccess = true;
      })
      .addCase(verifyOtpThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        s.verifyOtpSuccess = false;
      });

    // change password
    b.addCase(changePasswordThunk.pending, (s) => {
      s.changePasswordLoading = true; s.changePasswordError = null; s.changePasswordSuccess = false;
    })
      .addCase(changePasswordThunk.fulfilled, (s) => {
        s.changePasswordLoading = false; s.changePasswordSuccess = true;
      })
      .addCase(changePasswordThunk.rejected, (s, a) => {
        s.changePasswordLoading = false; s.changePasswordError = a.payload;
      });
    
    // verifyResetOtp
    b.addCase(verifyResetOtpThunk.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(verifyResetOtpThunk.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(verifyResetOtpThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });

    // sendResetOtp
    b.addCase(sendResetOtpThunk.pending, (s) => { s.loading = true; })
      .addCase(sendResetOtpThunk.fulfilled, (s) => { s.loading = false; })
      .addCase(sendResetOtpThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { resetChangePasswordState, resetRegisterState } = authSlice.actions;
export default authSlice.reducer;