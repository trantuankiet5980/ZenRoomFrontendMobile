import { createSlice } from '@reduxjs/toolkit';
import { loginThunk, loadSessionThunk, logoutThunk, changePasswordThunk } from './authThunks';

const initialState = {
  user: null,       // { role, userId, expiresAt }
  token: null,      // string
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
    }
  },
  extraReducers: (b) => {
    b.addCase(loadSessionThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadSessionThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.loadedSession = true;
        s.token = a.payload?.token || null;
        s.user = a.payload?.user || null;
      })
      .addCase(loadSessionThunk.rejected, (s) => {
        s.loading = false;
        s.loadedSession = true;
        s.token = null;
        s.user = null;
      });

    b.addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || 'Đăng nhập thất bại';
      });

    b.addCase(logoutThunk.fulfilled, (s) => {
      s.token = null;
      s.user = null;
    })
    // CHANGE PASSWORD
    b.addCase(changePasswordThunk.pending, (s) => {
      s.changePasswordLoading = true;
      s.changePasswordError = null;
      s.changePasswordSuccess = false;
    });
    b.addCase(changePasswordThunk.fulfilled, (s) => {
      s.changePasswordLoading = false;
      s.changePasswordSuccess = true;
    });
    b.addCase(changePasswordThunk.rejected, (s, a) => {
      s.changePasswordLoading = false;
      s.changePasswordError = a.payload || 'Đổi mật khẩu thất bại';
      s.changePasswordSuccess = false;
    });
  }
});

export const { resetChangePasswordState } = authSlice.actions;
export default authSlice.reducer;
