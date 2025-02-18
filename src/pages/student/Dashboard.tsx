import { useState, useEffect } from "react";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { MapPin, Calendar, Clock, Activity, Car, X, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import MapboxLocationManager from "@/components/locations/MapboxLocationManager";
import { useAppDispatch } from "@/hooks/redux";
import { setActiveRide } from "@/features/rides/ridesSlice";
import { supabase } from '@/lib/supabase';
import { useStudentDashboard } from '@/hooks/use-student-dashboard';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapProvider } from '@/components/map/MapProvider';
import { useMap } from '@/components/map/MapProvider';
import { useStudentLocation } from '@/hooks/use-student-location';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RideLocation {
  lat: number;
  lng: number;
  address: string;
}

interface DriverProfile {
  id: string;
  full_name: string;
  phone_number: string;
  status: 'verified' | 'unverified';
  profile_picture_url: string | undefined;
}

interface RideStatus {
  status: 'requested' | 'cancelled' | 'completed';
}

const mockRide = {
  status: 'requested' as RideStatus,
  driver: {
    id: '1',
    full_name: 'John Doe',
    phone_number: '+1234567890',
    status: 'verified' as const,
    profile_picture_url: undefined
  } as DriverProfile,
  // ... other required fields
};

const StudentDashboard = () => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<{
    status: string;
    estimatedWait: string;
    nearbyDrivers: number;
  } | null>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { mapboxToken } = useMap();
  const { currentLocation, error: locationError } = useStudentLocation(mapboxToken);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [rideRequest, setRideRequest] = useState({
    pickup: "",
    dropoff: "",
    notes: "",
    specialRequirements: "",
    pickupLocation: null as RideLocation | null,
    dropoffLocation: null as RideLocation | null,
  });

  const handleLocationSelect = (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
    setRideRequest(prev => ({
      ...prev,
      [type === 'pickup' ? 'pickupLocation' : 'dropoffLocation']: {
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      },
      [type === 'pickup' ? 'pickup' : 'dropoff']: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
  };

  useEffect(() => {
    if (useCurrentLocation && currentLocation) {
      setRideRequest(prev => ({
        ...prev,
        pickupLocation: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          address: currentLocation.address
        },
        pickup: currentLocation.address
      }));
    }
  }, [currentLocation, useCurrentLocation]);

  const handleRideRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rideRequest.pickupLocation || !rideRequest.dropoffLocation) {
      toast({
        title: "Missing Locations",
        description: "Please select both pickup and dropoff locations on the map",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.id) throw new Error('Not authenticated');

      const { data: rideData, error: rideError } = await supabase
        .from('ride_requests')
        .insert({
          student_id: user.id,
          pickup_location: `POINT(${rideRequest.pickupLocation.lng} ${rideRequest.pickupLocation.lat})`,
          dropoff_location: `POINT(${rideRequest.dropoffLocation.lng} ${rideRequest.dropoffLocation.lat})`,
          pickup_address: rideRequest.pickupLocation.address,
          dropoff_address: rideRequest.dropoffLocation.address,
          status: 'requested',
          notes: rideRequest.notes,
          special_requirements: rideRequest.specialRequirements
        })
        .select()
        .single();

      if (rideError) throw rideError;

      setActiveRequest({
        status: "Searching for driver",
        estimatedWait: "5-10 minutes",
        nearbyDrivers: 3,
      });

      dispatch(setActiveRide({
        id: rideData.id,
        date: new Date().toISOString(),
        pickup: rideRequest.pickupLocation.address,
        dropoff: rideRequest.dropoffLocation.address,
        status: 'Upcoming',
        driver: mockRide.driver,
        payment: {
          method: 'cash',
          status: 'pending',
          amount: 0
        }
      }));

      toast({
        title: "Ride Requested",
        description: "Looking for available drivers...",
      });
      
      setIsRequestOpen(false);
    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Error",
        description: "Failed to create ride request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('student_id', user.id)
        .eq('status', 'requested');

      if (error) throw error;

      setActiveRequest(null);
      dispatch(setActiveRide(null));

      toast({
        title: "Ride Cancelled",
        description: "Your ride request has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const { stats, recentActivity, nearbyDrivers, isLoading } = useStudentDashboard();

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-[#F1F0FB] to-white dark:from-gray-900 dark:to-gray-800">
          <StudentSidebar />
          <main className="flex-1 p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <MapProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-[#F1F0FB] to-white dark:from-gray-900 dark:to-gray-800">
          <StudentSidebar />
          <main className="flex-1 p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                  <DialogTrigger asChild>
                    <Button className={`${navigationMenuTriggerStyle()} hover:scale-105 transition-transform duration-200`}>
                      Book a Ride
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px] animate-scale-in">
                    <DialogHeader>
                      <DialogTitle>Request a Ride</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRideRequest} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="pickup">Pickup Location</Label>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="use-current" className="text-sm text-muted-foreground">
                                  Use Current Location
                                </Label>
                                <Switch
                                  id="use-current"
                                  checked={useCurrentLocation}
                                  onCheckedChange={setUseCurrentLocation}
                                />
                              </div>
                            </div>
                            <Input
                              id="pickup"
                              placeholder="Enter pickup location"
                              value={rideRequest.pickup}
                              onChange={(e) =>
                                setRideRequest({
                                  ...rideRequest,
                                  pickup: e.target.value,
                                })
                              }
                              className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                              required
                              readOnly={useCurrentLocation}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dropoff">Dropoff Location</Label>
                            <Input
                              id="dropoff"
                              placeholder="Enter dropoff location"
                              value={rideRequest.dropoff}
                              onChange={(e) =>
                                setRideRequest({
                                  ...rideRequest,
                                  dropoff: e.target.value,
                                })
                              }
                              className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label>Location Selection</Label>
                          <MapboxLocationManager 
                            onCoordinatesSelect={handleLocationSelect} 
                            className="min-h-[400px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialRequirements">
                          Special Requirements
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            setRideRequest({
                              ...rideRequest,
                              specialRequirements: value,
                            })
                          }
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select any special requirements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wheelchair">
                              Wheelchair Accessible
                            </SelectItem>
                            <SelectItem value="assistant">Need Assistant</SelectItem>
                            <SelectItem value="luggage">
                              Extra Luggage Space
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions?"
                          value={rideRequest.notes}
                          onChange={(e) =>
                            setRideRequest({
                              ...rideRequest,
                              notes: e.target.value,
                            })
                          }
                          className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsRequestOpen(false)}
                          className="hover:bg-secondary transition-colors duration-200"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="hover:scale-105 transition-transform duration-200"
                        >
                          Request Ride
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <QuickStat
                  title="Total Rides"
                  value={stats?.total_rides.toString() || "0"}
                  icon={<Activity className="h-6 w-6 text-purple-500" />}
                  trend={`${stats?.monthly_rides || 0} this month`}
                />
                <QuickStat
                  title="Today's Rides"
                  value={stats?.today_rides.toString() || "0"}
                  icon={<Car className="h-6 w-6 text-blue-500" />}
                  trend="Live tracking"
                />
                <QuickStat
                  title="Completed Rides"
                  value={stats?.completed_rides.toString() || "0"}
                  icon={<Calendar className="h-6 w-6 text-green-500" />}
                  trend={`${stats?.cancelled_rides || 0} cancelled`}
                />
                <QuickStat
                  title="Avg. Wait Time"
                  value={`${Math.round(stats?.avg_wait_minutes || 0)}min`}
                  icon={<Clock className="h-6 w-6 text-orange-500" />}
                  trend="Based on your history"
                />
              </div>

              {activeRequest && (
                <Card className="mb-8 border-l-4 border-l-blue-500 animate-fade-in hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 animate-pulse text-blue-500" />
                        Active Request
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-500 transition-colors duration-200">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="animate-scale-in">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Ride Request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your current ride
                              request? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="hover:bg-secondary transition-colors duration-200">Keep Request</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelRequest}
                              className="hover:bg-red-600 transition-colors duration-200"
                            >
                              Cancel Ride
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">{activeRequest.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Estimated Wait:
                          </span>
                          <span className="font-medium">
                            {activeRequest.estimatedWait}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Nearby Drivers:
                          </span>
                          <span className="font-medium">
                            {activeRequest.nearbyDrivers}
                          </span>
                        </div>
                      </div>
                      <MapboxLocationManager className="min-h-[300px]" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="animate-fade-in hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>Recent Rides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity?.map((ride) => (
                        <div
                          key={ride.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div>
                            <p className="font-medium">{ride.pickup_address} → {ride.dropoff_address}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatDistanceToNow(new Date(ride.created_at), { addSuffix: true })}</span>
                              <Badge variant={
                                ride.status === 'completed' ? 'success' :
                                ride.status === 'cancelled' ? 'destructive' : 'default'
                              }>
                                {ride.status}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>Available Drivers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {nearbyDrivers?.map((driver) => (
                        <div
                          key={driver.id}
                          className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                            {driver.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{driver.full_name}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{driver.average_rating?.toFixed(1)}</span>
                              <span className="mx-2">•</span>
                              <span>{Math.round(driver.distance_meters / 1000)}km away</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setIsRequestOpen(true)}
                            disabled={activeRequest !== null}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            Request
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </MapProvider>
    </SidebarProvider>
  );
};

const QuickStat = ({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) => (
  <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground">{title}</span>
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{trend}</div>
    </CardContent>
  </Card>
);

export default StudentDashboard;
