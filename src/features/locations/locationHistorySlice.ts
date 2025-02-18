
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CampusLocation } from '@/types/locations';

interface LocationHistoryEntry {
  location: CampusLocation;
  lastUsed: string;
  useCount: number;
}

interface LocationHistoryState {
  recentLocations: {
    pickup: LocationHistoryEntry[];
    dropoff: LocationHistoryEntry[];
  };
  frequentLocations: {
    pickup: LocationHistoryEntry[];
    dropoff: LocationHistoryEntry[];
  };
}

const MAX_RECENT_LOCATIONS = 5;
const MAX_FREQUENT_LOCATIONS = 5;

const initialState: LocationHistoryState = {
  recentLocations: {
    pickup: [],
    dropoff: [],
  },
  frequentLocations: {
    pickup: [],
    dropoff: [],
  },
};

const locationHistorySlice = createSlice({
  name: 'locationHistory',
  initialState,
  reducers: {
    addLocation: (
      state,
      action: PayloadAction<{
        location: CampusLocation;
        type: 'pickup' | 'dropoff';
      }>
    ) => {
      const { location, type } = action.payload;
      const now = new Date().toISOString();

      // Update recent locations
      const recentEntry = {
        location,
        lastUsed: now,
        useCount: 1,
      };

      // Remove existing entry if present
      state.recentLocations[type] = state.recentLocations[type].filter(
        entry => entry.location.id !== location.id
      );

      // Add to beginning of array and limit size
      state.recentLocations[type].unshift(recentEntry);
      state.recentLocations[type] = state.recentLocations[type].slice(0, MAX_RECENT_LOCATIONS);

      // Update frequent locations
      const frequentIndex = state.frequentLocations[type].findIndex(
        entry => entry.location.id === location.id
      );

      if (frequentIndex !== -1) {
        // Increment count for existing location
        state.frequentLocations[type][frequentIndex].useCount++;
        state.frequentLocations[type][frequentIndex].lastUsed = now;
      } else {
        // Add new location
        state.frequentLocations[type].push(recentEntry);
      }

      // Sort by frequency and limit size
      state.frequentLocations[type].sort((a, b) => b.useCount - a.useCount);
      state.frequentLocations[type] = state.frequentLocations[type].slice(0, MAX_FREQUENT_LOCATIONS);
    },
    clearHistory: (state) => {
      state.recentLocations = initialState.recentLocations;
      state.frequentLocations = initialState.frequentLocations;
    },
  },
});

export const { addLocation, clearHistory } = locationHistorySlice.actions;
export default locationHistorySlice.reducer;

