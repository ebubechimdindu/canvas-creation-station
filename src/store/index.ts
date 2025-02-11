
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ridesReducer from '../features/rides/ridesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rides: ridesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
