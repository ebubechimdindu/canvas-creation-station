
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Driver } from '@/types';

interface UseDriverMatchingProps {
  rideRequestId?: number;
  pickupLocation?: { lat: number; lng: number };
  maxDistance?: number;
}

export const useDriverMatching = ({ 
  rideRequestId,
  pickupLocation,
  maxDistance = 5000
}: UseDriverMatchingProps) => {
  const [matchedDriver, setMatchedDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  const { data: nearbyDrivers, isLoading, error: queryError } = useQuery({
    queryKey: ['nearbyDrivers', pickupLocation],
    queryFn: async () => {
      if (!pickupLocation) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase.rpc(
        'find_nearby_drivers',
        {
          pickup_point: `POINT(${pickupLocation.lng} ${pickupLocation.lat})`,
          max_distance_meters: maxDistance,
          max_results: 10
        }
      );

      if (error) {
        console.error('Error finding nearby drivers:', error);
        throw error;
      }

      // Transform and validate the database response
      return (data || []).map((driver: any): Driver => ({
        id: driver.driver_id,
        name: driver.full_name,
        phoneNumber: driver.phone_number,
        profilePictureUrl: driver.profile_picture_url,
        status: driver.status === 'verified' ? 'available' : 'offline',
        rating: driver.rating || 4.5,
        distance: driver.distance,
        currentLocation: driver.current_location ? {
          lat: driver.current_location.coordinates[1],
          lng: driver.current_location.coordinates[0]
        } : undefined,
        lastUpdated: driver.last_updated
      }));
    },
    enabled: !!pickupLocation,
    refetchInterval: 10000,
    retry: 3,
    meta: {
      errorMessage: "Failed to find nearby drivers. Please try again."
    },
    onSettled: (data, error) => {
      if (error) {
        toast({
          title: "Error",
          description: "Failed to find nearby drivers. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  useEffect(() => {
    if (!rideRequestId) return;

    // Subscribe to ride request updates
    const channel = supabase
      .channel(`ride_request_${rideRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${rideRequestId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          const driverId = payload.new.driver_id;

          if (driverId && newStatus === 'driver_assigned') {
            // Fetch driver details when assigned
            supabase
              .from('driver_profiles')
              .select('*')
              .eq('id', driverId)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching driver details:', error);
                  return;
                }
                
                if (data) {
                  setMatchedDriver({
                    id: data.id,
                    name: data.full_name,
                    phoneNumber: data.phone_number,
                    profilePictureUrl: data.profile_picture_url,
                    status: 'available',
                    rating: 4.5,
                    distance: 0,
                    lastUpdated: new Date().toISOString()
                  });
                }
              });

            toast({
              title: "Driver Found!",
              description: "A driver has been assigned to your ride.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideRequestId, toast]);

  return {
    nearbyDrivers,
    matchedDriver,
    isLoading,
    error: queryError
  };
};
