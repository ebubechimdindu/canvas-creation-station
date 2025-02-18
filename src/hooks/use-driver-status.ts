
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateDriverStatus } from '@/features/rides/ridesSlice';

export const useDriverStatus = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAvailability = async (newStatus: 'available' | 'offline' | 'busy') => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update your status.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Update driver status
      const { error: statusError } = await supabase
        .from('driver_profiles')
        .update({
          status: newStatus === 'offline' ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (statusError) throw statusError;

      // Update location status
      const { error: locationError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          is_online: newStatus !== 'offline',
          is_active: newStatus === 'available',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      if (locationError) throw locationError;

      // Update redux store
      dispatch(updateDriverStatus(newStatus));
      
      queryClient.invalidateQueries({ queryKey: ['driverStatus'] });
      
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    toggleAvailability,
  };
};
