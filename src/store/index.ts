
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ridesReducer from '../features/rides/ridesSlice';
import { authMiddleware } from '../middleware/authMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rides: ridesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
// This prevents circular type references
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
