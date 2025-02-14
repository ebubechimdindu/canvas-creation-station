
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Driver } from '@/types';
import { toast } from '@/hooks/use-toast';

type DriverLocation = {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: string;
};

// Define the PostGIS point type
type PostGISPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Define the shape of the data we expect from Supabase
type SupabaseDriverLocation = {
  id: number;
  location: PostGISPoint;
  heading: number | null;
  speed: number | null;
  is_online: boolean | null;
  driver_id: string;
  driver_profiles?: {
    full_name: string | null;
    profile_picture_url: string | null;
    max_search_radius_km: number | null;
  } | null;
};

export const useLocationUpdates = (mode: 'current-driver' | 'all-drivers') => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
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
            is_online,
            driver_id,
            driver_profiles (
              full_name,
              profile_picture_url,
              max_search_radius_km
            )
          `)
          .eq('is_online', true);

        if (fetchError) {
          console.error('Error fetching driver locations:', fetchError);
          setError('Failed to fetch driver locations');
          return;
        }

        if (!data) return;

        // Transform the data into the expected format
        const transformedData = (data as unknown as SupabaseDriverLocation[]).map(item => ({
          id: item.driver_id,
          currentLocation: {
            lat: item.location.coordinates[1],
            lng: item.location.coordinates[0],
            heading: item.heading || 0,
            speed: item.speed || 0,
            timestamp: new Date().toISOString(),
          },
          name: item.driver_profiles?.full_name || 'Unknown Driver',
          rating: 0, // Default value as per Driver type
          distance: 0, // Default value as per Driver type
          status: item.is_online ? 'available' as const : 'offline' as const,
          accountDetails: {
            bankName: '',
            accountNumber: '',
            accountName: '',
          },
          profilePicture: item.driver_profiles?.profile_picture_url || undefined,
          searchRadius: item.driver_profiles?.max_search_radius_km || 5 // Default 5km if not set
        }));

        setNearbyDrivers(transformedData);

        // If we're tracking a specific driver, set their location
        if (mode === 'current-driver' && transformedData.length > 0) {
          const currentDriver = transformedData[0];
          if (currentDriver?.currentLocation) {
            setDriverLocation({
              lat: currentDriver.currentLocation.lat,
              lng: currentDriver.currentLocation.lng,
              heading: currentDriver.currentLocation.heading,
              speed: currentDriver.currentLocation.speed,
              timestamp: currentDriver.currentLocation.timestamp,
            });
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
