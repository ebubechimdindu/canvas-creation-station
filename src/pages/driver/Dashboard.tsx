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

const DriverDashboard = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { error, driverStatus } = useAppSelector((state) => state.rides);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { driverLocation, nearbyDrivers } = useLocationUpdates("current-driver");

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleAvailability = () => {
    const newStatus = driverStatus === 'available' ? 'offline' : 'available';
    dispatch(updateDriverStatus(newStatus));
    toast({
      title: "Status Updated",
      description: `You are now ${newStatus}`,
    });
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  const handleDriverLocationUpdate = (lat: number, lng: number) => {
    // In a real app, this would update the driver's location in the database
    console.log('Driver location updated:', { lat, lng });
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
    <div className="flex h-screen bg-gray-50">
      <DriverSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600">Welcome back, John</p>
          </div>

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
                  driverLocation={driverLocation}
                  nearbyDrivers={nearbyDrivers}
                  onDriverLocationUpdate={handleDriverLocationUpdate}
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
            {['Total Rides', "Today's Earnings", 'Rating', 'Active Hours'].map((stat, index) => (
              <Card key={stat} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{stat}</CardTitle>
                  {[<Users />, <DollarSign />, <Star />, <Car />][index]}
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
                        {[
                          "128",
                          "₦5,240",
                          "4.8",
                          "6.5"
                        ][index]}
                      </div>
                      <p className="text-xs text-gray-500">
                        {[
                          "+5 from last week",
                          "+12% from yesterday",
                          "From 96 ratings",
                          "Hours today"
                        ][index]}
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
  );
};

export default DriverDashboard;
