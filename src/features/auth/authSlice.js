import { createSlice } from '@reduxjs/toolkit';
import { loginThunk, loadSessionThunk, logoutThunk } from './authThunks';

const initialState = {
  user: null,       // { role, userId, expiresAt }
  token: null,      // string
  loading: false,
  error: null,
  loadedSession: false,
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
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
        s.error = a.payload || 'Login failed';
     });

    b.addCase(logoutThunk.fulfilled, (s) => {
      s.token = null;
      s.user = null;
    });
  }
});

export default authSlice.reducer;
