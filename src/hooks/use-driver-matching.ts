
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
  maxDistance = 5000 // 5km default
}: UseDriverMatchingProps) => {
  const [matchedDriver, setMatchedDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  const { data: nearbyDrivers, isLoading } = useQuery({
    queryKey: ['nearbyDrivers', pickupLocation],
    queryFn: async () => {
      if (!pickupLocation) return [];

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

      return data || [];
    },
    enabled: !!pickupLocation,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  useEffect(() => {
    if (!rideRequestId) return;

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
          if (payload.new.driver_id && payload.new.status === 'driver_assigned') {
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
    isLoading
  };
};
