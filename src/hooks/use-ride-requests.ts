
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/redux';
import { type CampusLocation } from '@/types/locations';
import { type RideRequest, type DriverProfile, type RideStatus } from '@/types';

interface CreateRideRequestParams {
  pickup: CampusLocation;
  dropoff: CampusLocation;
  notes?: string;
  specialRequirements?: string;
}

interface PostgresChangePayload {
  new: RideRequest;
  old: RideRequest;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export const useRideRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const [isCreating, setIsCreating] = useState(false);

  const { data: activeRide, isLoading: isLoadingActive } = useQuery({
    queryKey: ['activeRide', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver:driver_profiles(
            id,
            full_name,
            phone_number,
            profile_picture_url,
            status
          )
        `)
        .eq('student_id', user.id)
        .in('status', [
          'requested',
          'finding_driver',
          'driver_assigned',
          'en_route_to_pickup',
          'arrived_at_pickup',
          'in_progress'
        ])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as RideRequest | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`ride_updates_${user.id}`)
      .on(
        'postgres_changes' as any, // Temporary type assertion to fix the error
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: `student_id=eq.${user.id}`
        },
        (payload: PostgresChangePayload) => {
          queryClient.invalidateQueries({ queryKey: ['activeRide'] });
          queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
          
          if (payload.new && payload.old && payload.new.status !== payload.old.status) {
            toast({
              title: 'Ride Update',
              description: `Your ride status has been updated to ${payload.new.status}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  const createRideRequest = async ({ pickup, dropoff, notes, specialRequirements }: CreateRideRequestParams) => {
    if (!user?.id) {
      throw new Error('User must be logged in to request a ride');
    }

    if (activeRide) {
      throw new Error('You already have an active ride request');
    }

    setIsCreating(true);
    try {
      const { data: pickupRef, error: pickupError } = await supabase
        .rpc('find_nearest_references', {
          point: pickup.coordinates,
          max_distance: 100
        });

      if (pickupError) throw pickupError;

      const { data: dropoffRef, error: dropoffError } = await supabase
        .rpc('find_nearest_references', {
          point: dropoff.coordinates,
          max_distance: 100
        });

      if (dropoffError) throw dropoffError;

      const { data, error } = await supabase
        .from('ride_requests')
        .insert({
          student_id: user.id,
          pickup_location: `POINT(${pickup.coordinates.lng} ${pickup.coordinates.lat})`,
          dropoff_location: `POINT(${dropoff.coordinates.lng} ${dropoff.coordinates.lat})`,
          pickup_address: pickup.name,
          dropoff_address: dropoff.name,
          pickup_reference_id: pickupRef?.[0]?.id,
          dropoff_reference_id: dropoffRef?.[0]?.id,
          notes,
          special_requirements: specialRequirements,
          status: 'requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      
      toast({
        title: "Ride Requested",
        description: "Looking for available drivers...",
      });

      return data;
    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Error",
        description: "Failed to create ride request. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const cancelRideRequest = async (rideId: number) => {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('student_id', user?.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      
      toast({
        title: "Ride Cancelled",
        description: "Your ride request has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const { data: rideHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['rideHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver:driver_profiles(
            id,
            full_name,
            phone_number,
            profile_picture_url,
            status
          ),
          ratings:ride_ratings(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    activeRide,
    isLoadingActive,
    isCreating,
    createRideRequest,
    cancelRideRequest,
    rideHistory,
    isLoadingHistory,
  };
};
