
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'verifying';
  error: string | null;
  lastSync: string | null;
  sessionExpiry: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
  lastSync: null,
  sessionExpiry: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startAuth: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.status = 'succeeded';
      state.error = null;
      state.lastSync = new Date().toISOString();
      state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      localStorage.setItem('user', JSON.stringify(action.payload));
      localStorage.setItem('sessionExpiry', state.sessionExpiry);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      state.lastSync = null;
      state.sessionExpiry = null;
      localStorage.removeItem('user');
      localStorage.removeItem('sessionExpiry');
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    syncUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.lastSync = new Date().toISOString();
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    startVerification: (state) => {
      state.status = 'verifying';
    },
    verificationComplete: (state) => {
      state.status = 'succeeded';
    },
  },
});

export const { 
  startAuth,
  login, 
  logout, 
  setError,
  syncUser,
  startVerification,
  verificationComplete 
} = authSlice.actions;

export default authSlice.reducer;
