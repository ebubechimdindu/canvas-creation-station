
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { type Driver } from '@/types';

interface UseNearbyDriversOptions {
  latitude: number;
  longitude: number;
  maxDistance?: number; // in meters
  enabled?: boolean;
}

export const useNearbyDrivers = ({ 
  latitude, 
  longitude, 
  maxDistance = 5000, // 5km default
  enabled = true 
}: UseNearbyDriversOptions) => {
  return useQuery({
    queryKey: ['nearbyDrivers', latitude, longitude, maxDistance],
    queryFn: async () => {
      const point = `POINT(${longitude} ${latitude})`;
      
      const { data, error } = await supabase
        .rpc('find_nearby_drivers', {
          pickup_point: point,
          max_distance_meters: maxDistance
        });

      if (error) throw error;

      return data.map((driver: any) => ({
        id: driver.driver_id,
        name: driver.driver_name,
        distance: driver.distance,
        currentLocation: {
          lat: driver.latitude,
          lng: driver.longitude,
          heading: driver.heading,
          speed: driver.speed,
          timestamp: driver.last_updated
        },
        status: driver.is_active ? 'available' : 'offline',
        rating: driver.average_rating || 0,
        phoneNumber: driver.phone_number,
        accountDetails: {
          bankName: '',
          accountNumber: '',
          accountName: ''
        }
      } as Driver));
    },
    enabled: enabled && !!latitude && !!longitude,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};
