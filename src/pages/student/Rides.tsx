
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
import { Calendar, Car, Search, Download, Star, Phone, MessageSquare, AlertTriangle } from "lucide-react";
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
import type { RideRequest, RideStatus, Driver, Ride, RIDE_STATUS_UI, RideStatusUI } from "@/types";
import { mapRideStatusToUI } from "@/types"; // Add this import
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
import { RideStatusBadge } from "@/components/rides/RideStatusBadge";

const StudentRides: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
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

  const { nearbyDrivers, error: locationError } = useLocationUpdates('all-drivers');

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
        (payload: any) => {
          if (payload.new.status !== payload.old.status) {
            dispatch(updateRideStatus({
              rideId: payload.new.id,
              status: payload.new.status
            }));

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

  const handleConfirmPickup = async () => {
    if (!activeRide?.id || !user?.id) return;
    
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeRide.id)
        .eq('student_id', user.id);

      if (error) throw error;

      toast({
        title: "Ride Started",
        description: "Have a safe journey!",
      });
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast({
        title: "Error",
        description: "Failed to confirm pickup. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide?.id || !user?.id) return;
    
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeRide.id)
        .eq('student_id', user.id);

      if (error) throw error;

      toast({
        title: "Ride Completed",
        description: "Thank you for riding with us! Please rate your experience.",
      });

      setIsRatingOpen(true);
      setSelectedRide(activeRide.id);
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: "Error",
        description: "Failed to complete ride. Please try again.",
        variant: "destructive"
      });
    }
  };

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
          rated_by: activeRide?.student_id,
          driver_id: activeRide?.driver_id
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

  const convertToRideFormat = (request: RideRequest): Ride => {
    const primaryBankAccount = request.driver_bank_accounts?.find(account => account.is_primary);
    
    return {
      id: request.id,
      student_id: request.student_id,
      driver_id: request.driver_id,
      date: request.created_at,
      pickup: request.pickup_address,
      dropoff: request.dropoff_address,
      driver: request.driver?.full_name || '',
      status: mapRideStatusToUI(request.status),
      rating: request.ratings?.[0]?.rating,
      payment: {
        method: 'transfer',
        status: 'pending',
        amount: 0
      },
      notes: request.notes,
      driverDetails: request.driver ? {
        id: request.driver.id,
        name: request.driver.full_name,
        phoneNumber: request.driver.phone_number,
        profilePictureUrl: request.driver.profile_picture_url,
        accountDetails: {
          bankName: primaryBankAccount?.bank_name || '',
          accountNumber: primaryBankAccount?.account_number || '',
          accountName: primaryBankAccount?.account_holder_name || ''
        }
      } : undefined
    };
  };

  const handleViewRideDetails = (ride: RideRequest) => {
    setSelectedRideDetails(ride);
    setIsDetailsModalOpen(true);
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
                  onConfirmPickup={handleConfirmPickup}
                  onCompleteRide={handleCompleteRide}
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
                          onRideSelect={handleViewRideDetails}
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
                      <CardTitle>{activeRide ? "Active Ride" : "No Active Ride"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeRide && activeRide.driver ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
                              {activeRide.driver.full_name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-lg">{activeRide.driver.full_name}</p>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
                                  <span>4.5</span>
                                </div>
                                <span>•</span>
                                <span>{activeRide.driver.phone_number}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h3 className="font-medium mb-2">Bank Account Details</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              {activeRide.driver_bank_accounts && activeRide.driver_bank_accounts.length > 0 ? (
                                <>
                                  <p className="flex justify-between">
                                    <span>Account Name:</span>
                                    <span className="font-medium">{activeRide.driver_bank_accounts[0].account_holder_name}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Bank Name:</span>
                                    <span className="font-medium">{activeRide.driver_bank_accounts[0].bank_name}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Account Number:</span>
                                    <span className="font-medium">{activeRide.driver_bank_accounts[0].account_number}</span>
                                  </p>
                                </>
                              ) : (
                                <p>No bank account information available</p>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <RideStatusBadge status={activeRide.status} animated />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-primary/10 hover:text-primary"
                                  onClick={() => window.location.href = `tel:${activeRide.driver.phone_number}`}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-primary/10 hover:text-primary"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No active ride at the moment</p>
                          <Button
                            className="mt-4"
                            onClick={() => setIsRequestOpen(true)}
                          >
                            Request a Ride
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
          
          {selectedRideDetails && (
            <RideDetailsModal
              ride={convertToRideFormat(selectedRideDetails)}
              open={isDetailsModalOpen}
              onOpenChange={setIsDetailsModalOpen}
            />
          )}
        </div>
      </MapProvider>
    </SidebarProvider>
  );
};

export default StudentRides;
