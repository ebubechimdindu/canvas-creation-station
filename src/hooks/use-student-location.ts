
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StudentLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: number;
  isWithinCampus: boolean;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

interface UseStudentLocationReturn {
  currentLocation: StudentLocation | null;
  error: string | null;
  isLoading: boolean;
  isOutsideCampus: boolean;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  accuracy: number | null;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

// Babcock University campus boundaries
export const CAMPUS_BOUNDS = {
  north: 6.8973, // Northernmost latitude
  south: 6.8873, // Southernmost latitude
  east: 3.7292,  // Easternmost longitude
  west: 3.7192   // Westernmost longitude
};

// Campus center coordinates for reference
export const CAMPUS_CENTER = {
  lat: (CAMPUS_BOUNDS.north + CAMPUS_BOUNDS.south) / 2,
  lng: (CAMPUS_BOUNDS.east + CAMPUS_BOUNDS.west) / 2
};

export const useStudentLocation = (mapboxToken?: string): UseStudentLocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<StudentLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [isOutsideCampus, setIsOutsideCampus] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const isWithinCampus = (lat: number, lng: number): boolean => {
    return lat >= CAMPUS_BOUNDS.south && 
           lat <= CAMPUS_BOUNDS.north && 
           lng >= CAMPUS_BOUNDS.west && 
           lng <= CAMPUS_BOUNDS.east;
  };

  const getDistanceToCampus = (lat: number, lng: number): number => {
    const closestLat = Math.max(CAMPUS_BOUNDS.south, Math.min(CAMPUS_BOUNDS.north, lat));
    const closestLng = Math.max(CAMPUS_BOUNDS.west, Math.min(CAMPUS_BOUNDS.east, lng));
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (closestLat - lat) * Math.PI / 180;
    const dLng = (closestLng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(closestLat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    if (!mapboxToken) return 'Unknown location';
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();
      return data.features[0]?.place_name || 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Failed to get user');
      }

      const withinCampus = isWithinCampus(lat, lng);
      setIsOutsideCampus(!withinCampus);

      if (!withinCampus) {
        const distance = getDistanceToCampus(lat, lng);
        toast({
          title: "Outside Campus Boundaries",
          description: `You are currently ${distance.toFixed(2)}km away from campus. Location updates are paused until you return to campus.`,
          variant: "destructive",
        });
        return;
      }

      const address = await getAddressFromCoordinates(lat, lng);

      const { error: upsertError } = await supabase
        .from('student_locations')
        .upsert({
          location: `POINT(${lng} ${lat})`,
          student_id: user.id,
          is_current_location: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        });

      if (upsertError) {
        console.error('Error updating location:', upsertError);
        throw upsertError;
      }

      setCurrentLocation({
        lat,
        lng,
        address,
        timestamp: Date.now(),
        isWithinCampus: withinCampus
      });

      // Reset connection status and retry count on successful update
      setConnectionStatus('connected');
      setRetryCount(0);

    } catch (err) {
      console.error('Error in location update:', err);
      setError('Failed to update location');
      
      // Handle connection issues
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_RETRIES) {
          setConnectionStatus('disconnected');
          toast({
            title: 'Connection Lost',
            description: 'Failed to update your location. Please check your internet connection.',
            variant: 'destructive',
          });
        } else {
          setConnectionStatus('reconnecting');
        }
        return newCount;
      });
    }
  };

  useEffect(() => {
    let watchId: number;

    const handleLocationUpdate = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy: locationAccuracy, heading, speed } = position.coords;
      setAccuracy(locationAccuracy);
      await updateLocation(latitude, longitude);
      setIsLoading(false);
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      setError(error.message);
      setIsLoading(false);
      
      toast({
        title: 'Location Error',
        description: error.code === error.PERMISSION_DENIED 
          ? 'Please enable location services to use this feature.'
          : 'Failed to get your location. Please try again.',
        variant: 'destructive',
      });
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { 
    currentLocation, 
    error, 
    isLoading, 
    updateLocation, 
    accuracy, 
    connectionStatus,
    isOutsideCampus 
  };
};
