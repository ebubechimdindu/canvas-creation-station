
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/redux';
import { type CampusLocation } from '@/types/locations';

interface CreateRideRequestParams {
  pickup: CampusLocation;
  dropoff: CampusLocation;
  notes?: string;
  specialRequirements?: string;
}

export const useRideRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch active ride request for current user
  const { data: activeRide, isLoading: isLoadingActive } = useQuery({
    queryKey: ['activeRide', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver:driver_profiles(*)
        `)
        .eq('student_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create new ride request
  const createRideRequest = async ({ pickup, dropoff, notes, specialRequirements }: CreateRideRequestParams) => {
    if (!user?.id) {
      throw new Error('User must be logged in to request a ride');
    }

    if (activeRide) {
      throw new Error('You already have an active ride request');
    }

    setIsCreating(true);
    try {
      // First, find nearest reference points
      const { data: pickupRef, error: pickupError } = await supabase
        .rpc('find_nearest_references', {
          point: pickup.coordinates,
          max_distance: 100 // meters
        });

      if (pickupError) throw pickupError;

      const { data: dropoffRef, error: dropoffError } = await supabase
        .rpc('find_nearest_references', {
          point: dropoff.coordinates,
          max_distance: 100
        });

      if (dropoffError) throw dropoffError;

      // Create the ride request
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
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate queries to refetch data
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

  // Cancel ride request
  const cancelRideRequest = async (rideId: number) => {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'cancelled',
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

  return {
    activeRide,
    isLoadingActive,
    isCreating,
    createRideRequest,
    cancelRideRequest,
  };
};
