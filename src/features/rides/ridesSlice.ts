
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
    updateRideStatus: (state, action: PayloadAction<{ rideId: number; status: RideStatus; timestamp?: string }>) => {
      const { rideId, status, timestamp } = action.payload;
      if (state.activeRide?.id === rideId) {
        state.activeRide.status = status;
        
        // Update timestamps based on status
        if (timestamp) {
          switch (status) {
            case 'driver_assigned':
              state.activeRide.matched_at = timestamp;
              break;
            case 'arrived_at_pickup':
              // No change in matched_at
              break;
            case 'in_progress':
              state.activeRide.started_at = timestamp;
              break;
            case 'completed':
              state.activeRide.completed_at = timestamp;
              break;
            case 'cancelled':
              state.activeRide.cancelled_at = timestamp;
              break;
          }
        }
      }
      
      state.history = state.history.map(ride => 
        ride.id === rideId 
          ? { 
              ...ride, 
              status,
              ...(timestamp && { updated_at: timestamp })
            }
          : ride
      );
    },
    addToHistory: (state, action: PayloadAction<RideRequest>) => {
      // Add to beginning of history array and ensure no duplicates
      const exists = state.history.some(ride => ride.id === action.payload.id);
      if (!exists) {
        state.history.unshift(action.payload);
      }
    },
    updateDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.availableDrivers = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = action.payload ? 'failed' : 'idle';
    },
    updateDriverStatus: (state, action: PayloadAction<'available' | 'offline' | 'busy'>) => {
      state.driverStatus = action.payload;
    },
    clearActiveRide: (state) => {
      if (state.activeRide) {
        // Move active ride to history before clearing
        state.history.unshift(state.activeRide);
        state.activeRide = null;
      }
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
  setError,
  updateDriverStatus,
  clearActiveRide,
  setEarningsLoading,
  setEarningsSuccess,
  setEarningsError,
} = ridesSlice.actions;

export default ridesSlice.reducer;
