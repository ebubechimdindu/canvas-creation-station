
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
