
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ride, Driver } from '../../types';

interface RidesState {
  activeRide: Ride | null;
  history: Ride[];
  availableDrivers: Driver[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RidesState = {
  activeRide: null,
  history: [],
  availableDrivers: [],
  status: 'idle',
  error: null,
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
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
});

export const { setActiveRide, addToHistory, updateDrivers, setError } = ridesSlice.actions;
export default ridesSlice.reducer;
