import { createSlice } from "@reduxjs/toolkit";
import { updateProfile,getProfile } from "./userThunks";

const initialState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
    },
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
            .addCase(getProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            });
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
