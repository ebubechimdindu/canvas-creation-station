
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/redux';

interface StudentStats {
  total_rides: number;
  today_rides: number;
  monthly_rides: number;
  avg_wait_minutes: number;
  completed_rides: number;
  cancelled_rides: number;
}

interface RecentActivity {
  id: number;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
  driver_name: string | null;
  rating: number;
  fare_amount: number | null;
}

export const useStudentDashboard = () => {
  const { toast } = useToast();
  const user = useAppSelector((state) => state.auth.user);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['studentStats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('student_dashboard_stats')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (error) throw error;
      return data as StudentStats;
    },
    enabled: !!user?.id,
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['studentRecentActivity', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('student_recent_activity')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as RecentActivity[];
    },
    enabled: !!user?.id,
  });

  const { data: nearbyDrivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['nearbyDrivers', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('find_nearest_driver', { 
          radius_meters: 5000, // 5km radius
          limit_count: 5 
        });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    stats,
    recentActivity,
    nearbyDrivers,
    isLoading: isLoadingStats || isLoadingActivity || isLoadingDrivers,
  };
};
