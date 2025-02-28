
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppSelector } from '@/hooks/redux';
import { useToast } from '@/hooks/use-toast';

export const useDriverLocation = () => {
  const { driverStatus } = useAppSelector((state) => state.rides);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let watchId: number;

    const updateLocation = async (position: GeolocationPosition) => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Failed to get user');
        }

        // Add slight randomization to locations to avoid all drivers at exact same spot
        // This is a small random offset (±0.0005 degrees, roughly 50 meters)
        const randomLat = position.coords.latitude + (Math.random() - 0.5) * 0.001;
        const randomLng = position.coords.longitude + (Math.random() - 0.5) * 0.001;

        const { error: upsertError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: user.id,
            location: `POINT(${randomLng} ${randomLat})`,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
            is_online: driverStatus !== 'offline',
            is_active: true,
            updated_at: new Date().toISOString()
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
        toast({
          title: 'Error',
          description: 'Failed to update location. Please try again.',
          variant: 'destructive',
        });
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
  }, [driverStatus, toast]);

  return { error };
};
