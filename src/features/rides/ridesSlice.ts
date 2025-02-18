
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Driver, RideRequest, RideStatus } from '../../types';

interface RidesState {
  activeRide: RideRequest | null;
  history: RideRequest[];
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
    setActiveRide: (state, action: PayloadAction<RideRequest | null>) => {
      state.activeRide = action.payload;
    },
    updateRideStatus: (state, action: PayloadAction<{ rideId: number; status: RideStatus }>) => {
      if (state.activeRide?.id === action.payload.rideId) {
        state.activeRide.status = action.payload.status;
      }
      
      state.history = state.history.map(ride => 
        ride.id === action.payload.rideId 
          ? { ...ride, status: action.payload.status }
          : ride
      );
    },
    addToHistory: (state, action: PayloadAction<RideRequest>) => {
      state.history.unshift(action.payload);
    },
    updateDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.availableDrivers = action.payload;
    },
    markPaymentReceived: (state, action: PayloadAction<number>) => {
      const ride = state.history.find(ride => ride.id === action.payload);
      if (ride) {
        ride.status = 'completed';
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
  updateRideStatus,
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
