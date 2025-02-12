
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ride, Driver } from '../../types';

interface RidesState {
  activeRide: Ride | null;
  history: Ride[];
  availableDrivers: Driver[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  driverStatus: 'available' | 'offline' | 'busy';
}

const initialState: RidesState = {
  activeRide: null,
  history: [],
  availableDrivers: [],
  status: 'idle',
  error: null,
  driverStatus: 'offline',
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
  },
});

export const { 
  setActiveRide, 
  addToHistory, 
  updateDrivers, 
  markPaymentReceived,
  setError,
  updateDriverStatus
} = ridesSlice.actions;

export default ridesSlice.reducer;

