
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Driver } from '@/types';
import { useToast } from '@/hooks/use-toast';

type DriverLocation = {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: string;
};

type PostGISPoint = {
  type: 'Point';
  coordinates: [number, number];
}

type SupabaseDriverLocation = {
  id: number;
  location: PostGISPoint;
  heading: number | null;
  speed: number | null;
  is_online: boolean | null;
  driver_id: string;
  updated_at: string | null;
  driver_profiles?: {
    full_name: string | null;
    profile_picture_url: string | null;
    max_search_radius_km: number | null;
    phone_number: string | null;
  } | null;
};

export const useLocationUpdates = (mode: 'current-driver' | 'all-drivers') => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDriverLocations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error: fetchError } = await supabase
          .from('driver_locations')
          .select(`
            id,
            location,
            heading,
            speed,
            is_online,
            driver_id,
            updated_at,
            driver_profiles (
              full_name,
              profile_picture_url,
              max_search_radius_km,
              phone_number,
              status
            )
          `)
          .eq(mode === 'current-driver' ? 'driver_id' : 'is_online', mode === 'current-driver' ? user.id : true);

        if (fetchError) {
          console.error('Error fetching driver locations:', fetchError);
          setError('Failed to fetch driver locations');
          return;
        }

        if (!data) return;

        const transformedData = (data as unknown as SupabaseDriverLocation[]).map(item => ({
          id: item.driver_id,
          name: item.driver_profiles?.full_name || 'Unknown Driver',
          phoneNumber: item.driver_profiles?.phone_number || '',
          profilePictureUrl: item.driver_profiles?.profile_picture_url || null,
          status: item.is_online ? 'available' as const : 'offline' as const,
          rating: 4.5,
          distance: 0,
          currentLocation: {
            lat: item.location.coordinates[1],
            lng: item.location.coordinates[0]
          },
          lastUpdated: item.updated_at || new Date().toISOString()
        }));

        setNearbyDrivers(transformedData);

        if (mode === 'current-driver' && transformedData.length > 0) {
          const currentDriver = transformedData[0];
          if (currentDriver?.currentLocation) {
            setDriverLocation({
              lat: currentDriver.currentLocation.lat,
              lng: currentDriver.currentLocation.lng,
              heading: 0,
              speed: 0,
              timestamp: currentDriver.lastUpdated,
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

    fetchDriverLocations();

    const channel = supabase.channel('driver-locations')
      .on(
        'postgres_changes',
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

    return () => {
      channel.unsubscribe();
    };
  }, [mode, toast]);

  return { driverLocation, nearbyDrivers, error };
};
