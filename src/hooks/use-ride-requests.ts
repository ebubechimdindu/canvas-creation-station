
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

  // Active ride query
  const { data: fetchedActiveRide, isLoading: isLoadingActive } = useQuery({
    queryKey: ['activeRide', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      console.log('Fetching active ride for user:', user.id);

      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver:driver_profiles!ride_requests_driver_id_fkey(
            id,
            full_name,
            phone_number,
            profile_picture_url,
            status,
            driver_bank_accounts (
              id,
              bank_name,
              account_number,
              account_holder_name
            )
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

      if (error) {
        console.error('Error fetching active ride:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No active ride found');
        return null;
      }

      console.log('Found active ride:', data);

      if (data.driver?.id) {
        const { data: ratings, error: ratingsError } = await supabase
          .from('ride_ratings')
          .select('rating')
          .eq('driver_id', data.driver.id);

        if (ratingsError) {
          console.error('Error fetching driver ratings:', ratingsError);
        }

        if (!ratingsError && ratings) {
          const avgRating = ratings.length > 0
            ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
            : '0.0';

          const enhancedData = {
            ...data,
            driver: {
              ...data.driver,
              average_rating: avgRating,
              account_details: data.driver.driver_bank_accounts?.[0] || null
            }
          };
          
          console.log('Enhanced ride data with ratings:', enhancedData);
          return enhancedData;
        }
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Effect to update Redux store with active ride
  useEffect(() => {
    if (fetchedActiveRide) {
      console.log('Updating Redux store with active ride:', fetchedActiveRide);
      dispatch(setActiveRide(fetchedActiveRide));
    }
  }, [fetchedActiveRide, dispatch]);

  // Ride history query with enhanced logging
  const { data: rideHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['rideHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching ride history for user:', user.id);

      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          driver:driver_profiles(
            id,
            full_name,
            phone_number,
            profile_picture_url,
            status,
            driver_bank_accounts(*)
          ),
          ratings:ride_ratings(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ride history:', error);
        throw error;
      }

      console.log('Fetched ride history:', data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Real-time updates subscription
  useEffect(() => {
    if (!activeRide?.id) return;

    console.log('Setting up real-time updates for ride:', activeRide.id);

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
          console.log('Received real-time update:', payload);

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
                dispatch(addToHistory(payload.new));
                toast({
                  title: "Ride Cancelled",
                  description: "Your ride has been cancelled.",
                  variant: "destructive"
                });
                break;
            }

            queryClient.invalidateQueries({ queryKey: ['activeRide'] });
            queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [activeRide?.id, dispatch, queryClient, toast]);

  const cancelRideRequest = async (rideId: number) => {
    if (!user?.id) {
      throw new Error('User must be logged in to cancel a ride');
    }

    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('student_id', user.id)
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });

      toast({
        title: "Ride Cancelled",
        description: "Your ride request has been cancelled.",
      });

      dispatch(updateRideStatus({
        rideId,
        status: 'cancelled',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const createRideRequest = async ({ pickup, dropoff, notes, specialRequirements }: CreateRideRequestParams) => {
    if (!user?.id) {
      throw new Error('User must be logged in to request a ride');
    }

    // Only check for actual active rides, excluding completed and cancelled
    const { data: existingRide, error: checkError } = await supabase
      .from('ride_requests')
      .select('status')
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

    if (checkError) {
      console.error('Error checking active rides:', checkError);
      throw new Error('Failed to check active rides');
    }

    if (existingRide) {
      throw new Error('You already have an active ride request');
    }

    console.log('Creating ride request with locations:', { 
      pickup: {
        coordinates: pickup.coordinates,
        name: pickup.name
      }, 
      dropoff: {
        coordinates: dropoff.coordinates,
        name: dropoff.name
      }
    });
    
    if (!pickup?.coordinates || !dropoff?.coordinates) {
      console.error('Invalid coordinates:', { pickup, dropoff });
      throw new Error('Invalid pickup or dropoff location coordinates');
    }

    if (!pickup.coordinates.lat || !pickup.coordinates.lng || 
        !dropoff.coordinates.lat || !dropoff.coordinates.lng) {
      console.error('Missing coordinate values:', {
        pickup: pickup.coordinates,
        dropoff: dropoff.coordinates
      });
      throw new Error('Missing coordinate values');
    }

    setIsCreating(true);
    try {
      const { data: pickupRef, error: pickupError } = await supabase
        .rpc('find_nearest_references', {
          point: `POINT(${pickup.coordinates.lng} ${pickup.coordinates.lat})`,
          max_distance: 100
        });

      if (pickupError) {
        console.error('Error finding pickup reference:', pickupError);
        throw pickupError;
      }

      const { data: dropoffRef, error: dropoffError } = await supabase
        .rpc('find_nearest_references', {
          point: `POINT(${dropoff.coordinates.lng} ${dropoff.coordinates.lat})`,
          max_distance: 100
        });

      if (dropoffError) {
        console.error('Error finding dropoff reference:', dropoffError);
        throw dropoffError;
      }

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

  const handleRating = async (rideId: number, rating: number, review: string) => {
    if (!user?.id) {
      throw new Error('User must be logged in to submit rating');
    }

    try {
      const { error } = await supabase
        .from('ride_ratings')
        .insert({
          ride_id: rideId,
          driver_id: activeRide?.driver?.id,
          rating: rating,
          comment: review,
          rated_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });

      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
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
            status,
            driver_bank_accounts(*)
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
    handleRating,
    rideHistory,
    isLoadingHistory,
  };
};
