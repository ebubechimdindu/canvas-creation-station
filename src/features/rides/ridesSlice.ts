import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ride, Driver } from '../../types';

interface RidesState {
  activeRide: Ride | null;
  history: Ride[];
  availableDrivers: Driver[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  driverStatus: 'available' | 'offline' | 'busy';
  earnings: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    data: {
      daily: number;
      weekly: number;
      monthly: number;
      transactions: any[];
    };
  };
}

const initialState: RidesState = {
  activeRide: null,
  history: [],
  availableDrivers: [],
  status: 'idle',
  error: null,
  driverStatus: 'offline',
  earnings: {
    status: 'idle',
    error: null,
    data: {
      daily: 0,
      weekly: 0,
      monthly: 0,
      transactions: [],
    },
  },
};

const ridesSlice = createSlice({
  name: 'rides',
  initialState,
  reducers: {
    setActiveRide: (state, action: PayloadAction<Ride | null>) => {
      state.activeRide = action.payload;
    },
    addToHistory: (state, action: PayloadAction<Ride>) => {
      state.history.push(action.payload);
    },
    updateDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.availableDrivers = action.payload;
    },
    markPaymentReceived: (state, action: PayloadAction<number>) => {
      const ride = state.history.find(ride => ride.id === action.payload);
      if (ride && ride.payment) {
        ride.payment.status = 'paid';
        ride.payment.confirmedAt = new Date().toISOString();
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = action.payload ? 'failed' : 'idle';
    },
    updateDriverStatus: (state, action: PayloadAction<'available' | 'offline' | 'busy'>) => {
      state.driverStatus = action.payload;
    },
    setEarningsLoading: (state) => {
      state.earnings.status = 'loading';
    },
    setEarningsSuccess: (state, action: PayloadAction<{
      daily: number;
      weekly: number;
      monthly: number;
      transactions: any[];
    }>) => {
      state.earnings.status = 'succeeded';
      state.earnings.data = action.payload;
      state.earnings.error = null;
    },
    setEarningsError: (state, action: PayloadAction<string>) => {
      state.earnings.status = 'failed';
      state.earnings.error = action.payload;
    },
  },
});

export const { 
  setActiveRide, 
  addToHistory, 
  updateDrivers, 
  markPaymentReceived,
  setError,
  updateDriverStatus,
  setEarningsLoading,
  setEarningsSuccess,
  setEarningsError,
} = ridesSlice.actions;

export default ridesSlice.reducer;
