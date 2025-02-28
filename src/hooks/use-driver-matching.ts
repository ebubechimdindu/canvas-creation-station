
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

      // Transform the database response to match our Driver type
      // Ensure we get a random selection when multiple drivers are available
      const drivers = (data || []).map((driver: any): Driver => ({
        id: driver.driver_id,
        name: driver.full_name,
        phoneNumber: driver.phone_number,
        profilePictureUrl: driver.profile_picture_url,
        status: driver.status as 'available' | 'busy' | 'offline',
        rating: driver.rating,
        distance: driver.distance,
        currentLocation: driver.current_location ? {
          lat: driver.current_location.coordinates[1],
          lng: driver.current_location.coordinates[0]
        } : undefined,
        lastUpdated: driver.last_updated
      }));
      
      // Shuffle array to ensure different drivers get selected when they have same distance
      return drivers.sort(() => Math.random() - 0.5);
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
            // Get driver details to update matched driver state
            fetchAssignedDriverDetails(payload.new.driver_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideRequestId, toast]);

  // Add function to fetch driver details when a driver is assigned
  const fetchAssignedDriverDetails = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('Error fetching driver details:', error);
        return;
      }

      // Get driver's current location
      const { data: locationData, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (locationError) {
        console.error('Error fetching driver location:', locationError);
      }

      const currentLocation = locationData?.location
        ? {
            lat: locationData.location.coordinates[1],
            lng: locationData.location.coordinates[0]
          }
        : undefined;

      // Create driver object based on fetched data
      const driver: Driver = {
        id: data.id,
        name: data.full_name,
        phoneNumber: data.phone_number,
        profilePictureUrl: data.profile_picture_url,
        status: data.status as 'available' | 'busy' | 'offline',
        rating: 4.5, // Default rating if not available
        distance: 0, // Distance will be calculated separately
        currentLocation,
        lastUpdated: locationData?.updated_at || new Date().toISOString()
      };

      setMatchedDriver(driver);
    } catch (e) {
      console.error('Error in fetchAssignedDriverDetails:', e);
    }
  };

  return {
    nearbyDrivers,
    matchedDriver,
    isLoading
  };
};
