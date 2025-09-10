import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import furnishingsReducer from '../features/furnishings/furnishingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    furnishings: furnishingsReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
