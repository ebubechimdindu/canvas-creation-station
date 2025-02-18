
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ridesReducer from '../features/rides/ridesSlice';
import locationHistoryReducer from '../features/locations/locationHistorySlice';
import { authMiddleware } from '../middleware/authMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rides: ridesReducer,
    locationHistory: locationHistoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

