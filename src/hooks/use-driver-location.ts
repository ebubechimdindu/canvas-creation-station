
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/redux';

export const useDriverLocation = () => {
  const { driverStatus } = useAppSelector((state) => state.rides);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const { heading, speed } = position.coords;

      try {
        const { error: upsertError } = await supabase
          .from('driver_locations')
          .upsert({
            location: `POINT(${longitude} ${latitude})`,
            heading,
            speed,
            status: driverStatus,
          }, {
            onConflict: 'driver_id'
          });

        if (upsertError) {
          console.error('Error updating location:', upsertError);
          setError('Failed to update location');
          toast({
            title: 'Error',
            description: 'Failed to update location',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error in location update:', err);
        setError('Failed to update location');
      }
    };

    // Only watch location if driver is available or busy
    if (driverStatus !== 'offline') {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          updateLocation,
          (err) => {
            console.error('Geolocation error:', err);
            setError('Failed to get location');
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
        toast({
          title: 'Error',
          description: 'Geolocation is not supported by your browser',
          variant: 'destructive',
        });
      }
    }

    // Cleanup function to stop watching location
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [driverStatus]);

  return { error };
};
