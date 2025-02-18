import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActiveRide, addToHistory, updateDrivers, updateRideStatus } from "@/features/rides/ridesSlice";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import { useCampusLocations } from "@/hooks/use-campus-locations";
import { useRideRequests } from "@/hooks/use-ride-requests";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Search, Download } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/components/map/MapProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RideRequestForm } from "@/components/rides/RideRequestForm";
import { ActiveRideRequest } from "@/components/rides/ActiveRideRequest";
import { RideHistoryTable } from "@/components/rides/RideHistoryTable";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/lib/supabase";
import type { RideRequest } from "@/types";

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
        (payload) => {
          if (payload.new.status !== payload.old.status) {
            dispatch(updateRideStatus({
              rideId: payload.new.id,
              status: payload.new.status
            }));

            const statusMessages = {
              driver_assigned: 'Driver has been assigned to your ride',
              en_route_to_pickup: 'Driver is on the way to pick you up',
              arrived_at_pickup: 'Driver has arrived at pickup location',
              in_progress: 'Your ride has started',
              completed: 'Your ride has been completed',
              cancelled: 'Your ride has been cancelled'
            };

            const message = statusMessages[payload.new.status as keyof typeof statusMessages];
            if (message) {
              toast({
                title: 'Ride Update',
                description: message,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRide?.id, dispatch, toast]);

  const handleRideRequest = async (formData: any) => {
    try {
      await createRideRequest(formData);
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
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Car className="h-5 w-5" />
                      Request a Ride
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] h-[90vh] md:h-auto">
                    <DialogHeader>
                      <DialogTitle>Request a Ride</DialogTitle>
                    </DialogHeader>
                    <RideRequestForm
                      onSubmit={handleRideRequest}
                      onCancel={() => setIsRequestOpen(false)}
                      locations={locations}
                      locationsLoading={locationsLoading}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {activeRide && (
                  <ActiveRideRequest
                    status={activeRide.status}
                    pickup={activeRide.pickup_address}
                    dropoff={activeRide.dropoff_address}
                    driver={activeRide.driver}
                    onCancel={handleCancelRequest}
                  />
                )}

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

export default StudentRides;
