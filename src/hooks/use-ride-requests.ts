
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setActiveRide, updateRideStatus, addToHistory } from '@/features/rides/ridesSlice';
import type { CampusLocation } from '@/types/locations';
import type { RideRequest, RideStatus } from '@/types';

interface CreateRideRequestParams {
  pickup: CampusLocation;
  dropoff: CampusLocation;
  notes?: string;
  specialRequirements?: string;
}

export const useRideRequests = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const activeRide = useAppSelector((state) => state.rides.activeRide);

  const { data: fetchedActiveRide, isLoading: isLoadingActive } = useQuery({
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
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000,
    cacheTime: 2000,
    retry: false
  });

  useEffect(() => {
    if (fetchedActiveRide) {
      dispatch(setActiveRide(fetchedActiveRide));
    } else {
      dispatch(setActiveRide(null));
    }
  }, [fetchedActiveRide, dispatch]);

  useEffect(() => {
    if (!activeRide?.id) return;

    const channel = supabase
      .channel(`ride_${activeRide.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${activeRide.id}`
        },
        async (payload: any) => {
          if (payload.new.status !== payload.old.status) {
            dispatch(updateRideStatus({
              rideId: payload.new.id,
              status: payload.new.status as RideStatus,
              timestamp: new Date().toISOString()
            }));

            switch (payload.new.status) {
              case 'completed':
                dispatch(addToHistory(payload.new));
                break;
              case 'cancelled':
                toast({
                  title: "Ride Cancelled",
                  description: "Your ride has been cancelled.",
                  variant: "destructive"
                });
                break;
            }

            queryClient.invalidateQueries({ queryKey: ['activeRide'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRide?.id, dispatch, queryClient, toast]);

  const { data: rideHistory = [], isLoading: isLoadingHistory } = useQuery({
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
          ratings(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000,
    cacheTime: 2000,
    retry: false,
    initialData: []
  });

  const createRideRequest = async ({ pickup, dropoff, notes, specialRequirements }: CreateRideRequestParams) => {
    if (!user?.id) {
      throw new Error('User must be logged in to request a ride');
    }

    const { data: existingRide, error: checkError } = await supabase
      .from('ride_requests')
      .select('status')
      .eq('student_id', user.id)
      .not('status', 'in', ['completed', 'cancelled'])
      .maybeSingle();

    if (checkError) {
      console.error('Error checking active rides:', checkError);
      throw new Error('Failed to check active rides');
    }

    if (existingRide) {
      throw new Error('You already have an active ride request');
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .insert({
          student_id: user.id,
          pickup_location: `POINT(${pickup.coordinates.lng} ${pickup.coordinates.lat})`,
          dropoff_location: `POINT(${dropoff.coordinates.lng} ${dropoff.coordinates.lat})`,
          pickup_address: pickup.name,
          dropoff_address: dropoff.name,
          notes,
          special_requirements: specialRequirements,
          status: 'requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ride request:', error);
        throw error;
      }

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
