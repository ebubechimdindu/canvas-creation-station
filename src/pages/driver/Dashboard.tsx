import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DriverSidebar from "@/components/driver/DriverSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, Star, Users, Map as MapIcon, Maximize2, Minimize2, Activity } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setError, updateDriverStatus } from "@/features/rides/ridesSlice";
import { Skeleton } from "@/components/ui/skeleton";
import RideMap from "@/components/map/RideMap";
import { useLocationUpdates } from "@/hooks/use-location-updates";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { MapProvider } from "@/components/map/MapProvider";
import { supabase } from "@/lib/supabase";
import { RideRequestCard } from "@/components/driver/RideRequestCard";
import { format, formatDistanceToNow } from "date-fns";

interface RideRequest {
  id: number;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: any;
  dropoff_location: any;
  estimated_distance: number;
  estimated_duration: number;
  estimated_earnings: number;
}

interface DriverStats {
  full_name: string;
  total_rides: number;
  today_rides: number;
  average_rating: number;
  total_ratings: number;
  today_earnings: number;
  week_earnings: number;
  active_hours: number;
}

interface RecentActivity {
  id: number;
  status: string;
  created_at: string;
  pickup_address: string;
  dropoff_address: string;
  rating: number | null;
  earnings: number;
  student_name: string;
  student_phone_number: string;
}

interface ActivityQueryResult {
  id: number;
  created_at: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  student_profiles: {
    full_name: string;
    phone_number: string;
  }[] | null;
  ride_ratings: {
    rating: number;
  }[] | null;
  driver_earnings: {
    amount: number;
  }[] | null;
}

const DriverDashboard = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { error, driverStatus } = useAppSelector((state) => state.rides);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { driverLocation, nearbyDrivers } = useLocationUpdates("current-driver");
  const { error: locationError } = useDriverLocation();
  const [currentRideRequest, setCurrentRideRequest] = useState<RideRequest | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!user?.id) {
          toast({
            title: "Error",
            description: "User not authenticated",
            variant: "destructive"
          });
          return;
        }

        console.log('Loading dashboard data for driver:', user.id);

        const { data: statsData, error: statsError } = await supabase
          .from('driver_stats_detailed')
          .select('*')
          .eq('driver_id', user.id)
          .single();

        if (statsError) {
          console.error('Error fetching driver stats:', statsError);
          throw statsError;
        }

        console.log('Stats data:', statsData);

        const { data: activityData, error: activityError } = await supabase
          .from('ride_requests')
          .select(`
            id,
            created_at,
            status,
            pickup_address,
            dropoff_address,
            student_profiles!inner (
              full_name,
              phone_number
            ),
            ride_ratings (
              rating
            ),
            driver_earnings (
              amount
            )
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activityError) {
          console.error('Error fetching activity:', activityError);
          throw activityError;
        }

        const formattedActivity: RecentActivity[] = activityData?.map(activity => ({
          id: activity.id,
          created_at: activity.created_at,
          status: activity.status,
          pickup_address: activity.pickup_address,
          dropoff_address: activity.dropoff_address,
          student_name: activity.student_profiles[0]?.full_name || 'Unknown Student',
          student_phone_number: activity.student_profiles[0]?.phone_number || 'N/A',
          rating: activity.ride_ratings?.[0]?.rating || null,
          earnings: activity.driver_earnings?.[0]?.amount || 0
        })) || [];

        console.log('Activity data:', formattedActivity);

        setRecentActivity(formattedActivity);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load dashboard data",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast, user?.id]);

  useEffect(() => {
    if (!driverStatus || driverStatus !== 'available') return;

    const subscription = supabase
      .channel('ride-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_requests',
          filter: 'status=eq.requested'
        },
        async (payload) => {
          const newRequest = payload.new as RideRequest;
          
          if (!currentRideRequest) {
            setCurrentRideRequest(newRequest);
            
            const audio = new Audio('/notification.mp3');
            audio.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [driverStatus, currentRideRequest]);

  const handleAcceptRide = async (rideId: number) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status: 'driver_assigned',
          driver_id: user.user.id
        })
        .eq('id', rideId)
        .eq('status', 'requested');

      if (updateError) throw updateError;

      toast({
        title: "Ride Accepted",
        description: "Head to the pickup location",
      });

      setCurrentRideRequest(null);
      dispatch(updateDriverStatus('busy'));

    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectRide = async (rideId: number) => {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'finding_driver'
        })
        .eq('id', rideId)
        .eq('status', 'requested');

      if (error) throw error;

      setCurrentRideRequest(null);
      toast({
        description: "Ride request rejected",
      });

    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast({
        title: "Error",
        description: "Failed to reject ride",
        variant: "destructive"
      });
    }
  };

  const toggleAvailability = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      if (!driverLocation) throw new Error('Location not available');

      const newStatus = driverStatus === 'available' ? 'offline' : 'available';
      
      const point = {
        type: 'Point',
        coordinates: [driverLocation.lng, driverLocation.lat]
      };

      const { error: locationError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.user.id,
          is_online: newStatus === 'available',
          is_active: newStatus === 'available',
          location: point,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      if (locationError) throw locationError;

      dispatch(updateDriverStatus(newStatus));
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  const mappedNearbyDrivers = nearbyDrivers.map(driver => ({
    lat: driver.currentLocation?.lat || 0,
    lng: driver.currentLocation?.lng || 0
  }));

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar />
        <main className="flex-1 p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h2>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={() => dispatch(setError(null))}
              variant="outline"
              className="hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MapProvider>
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600">Welcome back, {stats?.full_name || 'Driver'}</p>
            </div>

            {currentRideRequest && driverStatus === 'available' && (
              <RideRequestCard
                request={{
                  id: currentRideRequest.id,
                  pickup_address: currentRideRequest.pickup_address,
                  dropoff_address: currentRideRequest.dropoff_address,
                  status: 'requested',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  pickup_location: `${currentRideRequest.pickup_location}`,
                  dropoff_location: `${currentRideRequest.dropoff_location}`,
                  student_id: '',
                  notes: `Estimated earnings: ₦${currentRideRequest.estimated_earnings.toFixed(2)}\nEstimated distance: ${currentRideRequest.estimated_distance.toFixed(1)}km\nEstimated duration: ${Math.round(currentRideRequest.estimated_duration)}mins`
                }}
                onAccept={handleAcceptRide}
                onDecline={handleRejectRide}
              />
            )}

            <Card className={`transition-all duration-300 ${isMapExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'hover:shadow-lg'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-primary" />
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Live Map View
                  </span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                >
                  {isMapExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`transition-all duration-500 ease-in-out transform ${
                  isMapExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[400px]'
                }`}>
                  <RideMap
                    pickup=""
                    dropoff=""
                    mode="driver"
                    nearbyDrivers={mappedNearbyDrivers}
                    className="w-full h-full rounded-b-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={isMapExpanded ? 'hidden' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Status</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      <p className={`text-lg font-semibold ${
                        driverStatus === 'available' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {driverStatus === 'available' ? 'Available' : 'Offline'}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={toggleAvailability}
                    disabled={isLoading}
                    className="hover:scale-105 transition-transform duration-200"
                  >
                    {driverStatus === 'available' ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${isMapExpanded ? 'hidden' : ''}`}>
              {[
                {
                  title: 'Total Rides',
                  value: stats?.total_rides.toString() || '0',
                  subtext: `${stats?.today_rides || 0} rides today`,
                  icon: <Users className="h-4 w-4" />
                },
                {
                  title: "Today's Earnings",
                  value: `₦${stats?.today_earnings.toFixed(2) || '0.00'}`,
                  subtext: `₦${stats?.week_earnings.toFixed(2) || '0.00'} this week`,
                  icon: <DollarSign className="h-4 w-4" />
                },
                {
                  title: 'Rating',
                  value: (stats?.average_rating || 0).toFixed(1),
                  subtext: `From ${stats?.total_ratings || 0} ratings`,
                  icon: <Star className="h-4 w-4" />
                },
                {
                  title: 'Active Hours',
                  value: (stats?.active_hours || 0).toFixed(1),
                  subtext: "Hours today",
                  icon: <Car className="h-4 w-4" />
                }
              ].map((stat, index) => (
                <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    {stat.icon}
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {stat.value}
                        </div>
                        <p className="text-xs text-gray-500">
                          {stat.subtext}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className={isMapExpanded ? 'hidden' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                        <div className="space-y-1">
                          <p className="font-medium">{activity.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {activity.pickup_address} → {activity.dropoff_address}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₦{activity.earnings.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MapProvider>
  );
};

export default DriverDashboard;
