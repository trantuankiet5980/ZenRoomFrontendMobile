// userSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { updateProfile, getProfile, uploadAvatar, getPresignedAvatar } from "./userThunks";

const initialState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(uploadAvatar.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadAvatar.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) state.user.avatarUrl = action.payload.url;
            })
            .addCase(uploadAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // ----- getPresignedAvatar -----
            .addCase(getPresignedAvatar.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPresignedAvatar.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user.avatarUrl = action.payload.url;
                }
            })
            .addCase(getPresignedAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
