
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/redux';

export const useDriverLocation = () => {
  const { driverStatus } = useAppSelector((state) => state.rides);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    const ensureDriverProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        // Profile doesn't exist, create a temporary one
        const { error: createError } = await supabase
          .from('driver_profiles')
          .insert({
            id: userId,
            full_name: 'Temporary Driver', // Temporary name
            driver_license_number: 'PENDING', // Temporary license
            phone_number: 'PENDING', // Temporary phone
            status: 'pending_verification'
          });

        if (createError) {
          console.error('Error creating driver profile:', createError);
          throw new Error('Failed to create driver profile');
        }
      }
    };

    const updateLocation = async (position: GeolocationPosition) => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Failed to get user');
        }

        // Ensure driver profile exists before updating location
        await ensureDriverProfile(user.id);

        const { latitude, longitude } = position.coords;
        const { heading, speed } = position.coords;

        const { error: upsertError } = await supabase
          .from('driver_locations')
          .upsert({
            location: `POINT(${longitude} ${latitude})`,
            heading,
            speed,
            is_online: driverStatus !== 'offline',
            driver_id: user.id,
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
  }, [driverStatus]);

  return { error };
};
