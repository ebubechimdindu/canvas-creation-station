
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DriverSidebar from "@/components/driver/DriverSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, Star, Users, Map as MapIcon, Maximize2, Minimize2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setError, updateDriverStatus } from "@/features/rides/ridesSlice";
import { Skeleton } from "@/components/ui/skeleton";
import RideMap from "@/components/map/RideMap";
import { useLocationUpdates } from "@/hooks/use-location-updates";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { MapProvider } from "@/components/map/MapProvider";
import { supabase } from "@/integrations/supabase/client";
import RideRequestCard from "@/components/driver/RideRequestCard";

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

const DriverDashboard = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { error, driverStatus } = useAppSelector((state) => state.rides);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { driverLocation, nearbyDrivers, error: locationUpdateError } = useLocationUpdates("current-driver");
  const { error: locationError } = useDriverLocation();
  const [currentRideRequest, setCurrentRideRequest] = useState<RideRequest | null>(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    todayEarnings: 0,
    rating: 0,
    activeHours: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Get total rides
        const { count: totalRides } = await supabase
          .from('ride_requests')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.user.id)
          .eq('status', 'completed');

        // Get today's earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: earnings } = await supabase
          .from('driver_earnings')
          .select('amount')
          .eq('driver_id', user.user.id)
          .eq('status', 'paid')
          .gte('created_at', today.toISOString());

        const todayEarnings = earnings?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

        setStats({
          totalRides: totalRides || 0,
          todayEarnings,
          rating: 4.8, // TODO: Implement ratings
          activeHours: 6.5 // TODO: Calculate from driver_locations
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard stats",
          variant: "destructive"
        });
      }
    };

    loadStats();
  }, [toast]);

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
          
          // Only show request if we don't already have one
          if (!currentRideRequest) {
            setCurrentRideRequest(newRequest);
            
            // Play notification sound
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
      
      // Convert location to PostGIS point format
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
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600">Welcome back, John</p>
            </div>

            {/* Current Ride Request */}
            {currentRideRequest && driverStatus === 'available' && (
              <RideRequestCard
                id={currentRideRequest.id}
                pickupAddress={currentRideRequest.pickup_address}
                dropoffAddress={currentRideRequest.dropoff_address}
                estimatedEarnings={currentRideRequest.estimated_earnings || 0}
                estimatedDistance={currentRideRequest.estimated_distance || 0}
                estimatedDuration={currentRideRequest.estimated_duration || 0}
                onAccept={handleAcceptRide}
                onReject={handleRejectRide}
              />
            )}

            {/* Map Section */}
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
                  onClick={toggleMapSize}
                  className="hover:bg-primary/10 transition-colors duration-200"
                >
                  {isMapExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className={`transition-all duration-500 ease-in-out transform ${
                    isMapExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[400px]'
                  }`}
                >
                  <RideMap
                    pickup=""
                    dropoff=""
                    mode="driver"
                    nearbyDrivers={nearbyDrivers?.map(driver => ({
                      lat: driver.currentLocation?.lat || 0,
                      lng: driver.currentLocation?.lng || 0
                    })).filter(loc => loc.lat !== 0 && loc.lng !== 0)}
                    className="w-full h-full rounded-b-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Toggle */}
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

            {/* Stats Grid */}
            <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${isMapExpanded ? 'hidden' : ''}`}>
              {[
                {
                  title: 'Total Rides',
                  value: stats.totalRides.toString(),
                  subtext: "+5 from last week",
                  icon: <Users className="h-4 w-4" />
                },
                {
                  title: "Today's Earnings",
                  value: `₦${stats.todayEarnings.toFixed(2)}`,
                  subtext: "+12% from yesterday",
                  icon: <DollarSign className="h-4 w-4" />
                },
                {
                  title: 'Rating',
                  value: stats.rating.toString(),
                  subtext: "From 96 ratings",
                  icon: <Star className="h-4 w-4" />
                },
                {
                  title: 'Active Hours',
                  value: stats.activeHours.toString(),
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

            {/* Recent Activity */}
            <Card className={isMapExpanded ? 'hidden' : ''}>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">No recent activity</p>
                  </div>
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
