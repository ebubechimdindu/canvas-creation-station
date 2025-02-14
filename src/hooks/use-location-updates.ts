
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Driver } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useLocationUpdates = (mode: 'current-driver' | 'all-drivers') => {
  const [driverLocation, setDriverLocation] = useState<Driver['currentLocation'] | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverLocations = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('driver_locations')
          .select(`
            id,
            location,
            heading,
            speed,
            status,
            driver_id,
            driver_profiles (
              full_name,
              profile_picture_url
            )
          `)
          .neq('status', 'offline');

        if (fetchError) {
          console.error('Error fetching driver locations:', fetchError);
          setError('Failed to fetch driver locations');
          return;
        }

        // Transform the data into the expected format
        const transformedData = data.map(item => ({
          id: item.driver_id,
          currentLocation: {
            lat: parseFloat(item.location.coordinates[1]),
            lng: parseFloat(item.location.coordinates[0]),
            heading: item.heading || 0,
            speed: item.speed || 0
          },
          name: item.driver_profiles.full_name,
          status: item.status,
          profilePicture: item.driver_profiles.profile_picture_url
        }));

        setNearbyDrivers(transformedData);

        // If we're tracking a specific driver, set their location
        if (mode === 'current-driver') {
          const currentDriver = transformedData[0];
          if (currentDriver) {
            setDriverLocation(currentDriver.currentLocation);
          }
        }
      } catch (err) {
        console.error('Error in location updates:', err);
        setError('Failed to update locations');
        toast({
          title: 'Error',
          description: 'Failed to update locations',
          variant: 'destructive',
        });
      }
    };

    // Initial fetch
    fetchDriverLocations();

    // Subscribe to changes
    const channel = supabase
      .channel('driver-locations')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations'
        },
        () => {
          fetchDriverLocations();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [mode]);

  return { driverLocation, nearbyDrivers, error };
};
