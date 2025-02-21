
import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActiveRide, addToHistory, updateRideStatus } from "@/features/rides/ridesSlice";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import { useCampusLocations } from "@/hooks/use-campus-locations";
import { useRideRequests } from "@/hooks/use-ride-requests";
import { useLocationUpdates } from "@/hooks/use-location-updates";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Search, Download, Star } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/components/map/MapProvider";
import MapboxLocationManager from "@/components/map/MapboxLocationManager";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RideRequestForm } from "@/components/rides/RideRequestForm";
import { ActiveRideRequest } from "@/components/rides/ActiveRideRequest";
import { RideHistoryTable } from "@/components/rides/RideHistoryTable";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import type { RideRequest, RideStatus, Driver } from "@/types";
import type { CampusLocation } from "@/types/locations";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const StudentRides: React.FC = () => {
  const dispatch = useAppDispatch();
  const { locations = [], isLoading: locationsLoading } = useCampusLocations();
  const [selectedRide, setSelectedRide] = useState<number | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [review, setReview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLocations, setSelectedLocations] = useState<{
    pickup?: CampusLocation;
    dropoff?: CampusLocation;
  }>({});
  const { toast } = useToast();
  const [selectedRideDetails, setSelectedRideDetails] = useState<RideRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const {
    activeRide,
    isLoadingActive,
    isCreating,
    createRideRequest,
    cancelRideRequest,
    rideHistory,
    isLoadingHistory,
  } = useRideRequests();

  // Get nearby drivers using the hook
  const { nearbyDrivers, error: locationError } = useLocationUpdates('all-drivers');

  useEffect(() => {
    if (!activeRide?.id) return;

    // Subscribe to ride status changes
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
        (payload: any) => {
          if (payload.new.status !== payload.old.status) {
            dispatch(updateRideStatus({
              rideId: payload.new.id,
              status: payload.new.status
            }));

            // Status update notifications
            const statusMessages: Record<RideStatus, string> = {
              driver_assigned: 'Driver has been assigned to your ride',
              en_route_to_pickup: 'Driver is on the way to pick you up',
              arrived_at_pickup: 'Driver has arrived at pickup location',
              in_progress: 'Your ride has started',
              completed: 'Your ride has been completed',
              cancelled: 'Your ride has been cancelled',
              requested: 'Ride requested',
              finding_driver: 'Finding a driver',
              timeout: 'Request timed out'
            };

            toast({
              title: 'Ride Update',
              description: statusMessages[payload.new.status as RideStatus] || 'Status updated',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRide?.id, dispatch, toast]);

  const handleRideRequest = async (formData: {
    pickup: CampusLocation;
    dropoff: CampusLocation;
    notes?: string;
    specialRequirements?: string;
  }) => {
    try {
      setSelectedLocations({
        pickup: formData.pickup,
        dropoff: formData.dropoff
      });
      await createRideRequest(formData);
      setIsRequestOpen(false);
      toast({
        title: "Success",
        description: "Your ride request has been submitted",
      });
    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ride request",
        variant: "destructive"
      });
    }
  };

  const handleRating = async (rideId: number) => {
    try {
      const { error } = await supabase
        .from('ride_ratings')
        .insert({
          ride_id: rideId,
          rating,
          comment: review,
          rated_by: activeRide?.student_id
        });

      if (error) throw error;

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      setIsRatingOpen(false);
      setRating(0);
      setReview("");
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRide?.id) return;
    
    try {
      await cancelRideRequest(activeRide.id);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportHistory = () => {
    toast({
      title: "Export Started",
      description: "Your ride history is being downloaded.",
    });
  };

  const filteredRides = rideHistory?.filter((ride) => {
    const matchesSearch =
      ride.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.driver?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ride.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoadingActive || isLoadingHistory) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <MapProvider>
        <div className="flex min-h-screen w-full bg-background">
          <StudentSidebar />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Your Rides</h1>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="gap-2 hover:scale-105 transition-transform duration-200">
                      <Car className="h-5 w-5" />
                      Request a Ride
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[90vw] sm:w-[540px] p-0 bg-white">
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle>Request a Ride</SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto h-full pb-20">
                      <RideRequestForm
                        onSubmit={handleRideRequest}
                        onCancel={() => setIsRequestOpen(false)}
                        locations={locations}
                        locationsLoading={locationsLoading}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {activeRide && (
                <ActiveRideRequest
                  status={activeRide.status}
                  pickup={activeRide.pickup_address}
                  dropoff={activeRide.dropoff_address}
                  driver={activeRide.driver}
                  onCancel={handleCancelRequest}
                />
              )}

              <Card className="mb-6">
                <CardContent className="p-0">
                  <div className="h-[400px] w-full">
                    <MapboxLocationManager
                      selectedLocations={selectedLocations}
                      showRoutePath={true}
                      mode="student"
                      nearbyDrivers={nearbyDrivers?.map(driver => ({
                        lat: driver.currentLocation?.lat || 0,
                        lng: driver.currentLocation?.lng || 0
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ride History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <Input
                              placeholder="Search rides..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={handleExportHistory}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>

                        <RideHistoryTable
                          rides={filteredRides}
                          onRideSelect={(ride) => {
                            setSelectedRideDetails(ride);
                            setIsDetailsModalOpen(true);
                          }}
                          onRateRide={handleRating}
                          isRatingOpen={isRatingOpen}
                          setIsRatingOpen={setIsRatingOpen}
                          rating={rating}
                          setRating={setRating}
                          ratingHover={ratingHover}
                          setRatingHover={setRatingHover}
                          review={review}
                          setReview={setReview}
                          selectedRide={selectedRide}
                          setSelectedRide={setSelectedRide}
                        />

                        <div className="mt-4 flex justify-center">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious href="#" />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationNext href="#" />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
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
                              {driver.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{driver.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span>{driver.rating.toFixed(1)}</span>
                                <span className="mx-2">•</span>
                                <span>{Math.round(driver.distance)}km away</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setIsRequestOpen(true)}
                              disabled={!!activeRide}
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
            </div>
          </main>
        </div>
      </MapProvider>
    </SidebarProvider>
  );
};

export default StudentRides;
