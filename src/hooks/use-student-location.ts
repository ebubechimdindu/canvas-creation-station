
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StudentLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: number;
  isWithinCampus: boolean;
}

interface UseStudentLocationReturn {
  currentLocation: StudentLocation | null;
  error: string | null;
  isLoading: boolean;
  updateLocation: (lat: number, lng: number) => Promise<void>;
}

const CAMPUS_BOUNDS = {
  north: 6.8973,
  south: 6.8873,
  east: 3.7292,
  west: 3.7192
};

export const useStudentLocation = (mapboxToken?: string): UseStudentLocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<StudentLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isWithinCampus = (lat: number, lng: number) => {
    return lat >= CAMPUS_BOUNDS.south && 
           lat <= CAMPUS_BOUNDS.north && 
           lng >= CAMPUS_BOUNDS.west && 
           lng <= CAMPUS_BOUNDS.east;
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

      const address = await getAddressFromCoordinates(lat, lng);
      const withinCampus = isWithinCampus(lat, lng);

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

      if (!withinCampus) {
        toast({
          title: "Outside Campus",
          description: "Your current location is outside the campus boundaries.",
          variant: "default", // Changed from "warning" to "default" since "warning" is not a valid variant
        });
      }
    } catch (err) {
      console.error('Error in location update:', err);
      setError('Failed to update location');
      toast({
        title: 'Error',
        description: 'Failed to update your location. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    let watchId: number;

    const handleLocationUpdate = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      await updateLocation(latitude, longitude);
      setIsLoading(false);
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (err) => {
          console.error('Geolocation error:', err);
          setError('Failed to get location');
          setIsLoading(false);
          toast({
            title: 'Error',
            description: 'Failed to get your location. Please enable location services.',
            variant: 'destructive',
          });
        },
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

  return { currentLocation, error, isLoading, updateLocation };
};
