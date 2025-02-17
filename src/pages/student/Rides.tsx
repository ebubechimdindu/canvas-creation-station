import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActiveRide, addToHistory, updateDrivers } from "@/features/rides/ridesSlice";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import { useCampusLocations } from "@/hooks/use-campus-locations";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Search, Download } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/components/map/MapProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
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

const rides = [
  {
    id: 1,
    date: "2024-04-10",
    pickup: "Student Center",
    dropoff: "Library",
    driver: "John Doe",
    status: "Completed" as const,
    rating: 4,
  },
  {
    id: 2,
    date: "2024-04-11",
    pickup: "Dorm A",
    dropoff: "Science Building",
    driver: "Jane Smith",
    status: "Upcoming" as const,
    rating: null,
  },
  {
    id: 3,
    date: "2024-04-09",
    pickup: "Gym",
    dropoff: "Student Center",
    driver: "Mike Johnson",
    status: "Completed" as const,
    rating: 5,
  },
];

export default function StudentRides() {
  const dispatch = useAppDispatch();
  const { activeRide, history: rideHistory, availableDrivers } = useAppSelector(
    (state) => state.rides
  );
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
  const [activeRequest, setActiveRequest] = useState({
    status: "Searching for driver",
    estimatedWait: "5-10 minutes",
    nearbyDrivers: 3,
  });
  const [selectedRideDetails, setSelectedRideDetails] = useState<typeof rides[0] | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleRideRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locations || locations.length === 0) {
      toast({
        title: "Missing Locations",
        description: "Please select both pickup and dropoff locations.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newRide = {
        id: Date.now(),
        date: new Date().toISOString(),
        pickup: "pickup",
        dropoff: "dropoff",
        driver: "Pending",
        status: "Upcoming" as const,
      };
      
      dispatch(setActiveRide(newRide));
      toast({
        title: "Ride Requested",
        description: "Looking for available drivers...",
      });
      setIsRequestOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit ride request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRating = (rideId: number) => {
    toast({
      title: "Rating Submitted",
      description: "Thank you for your feedback!",
    });
    setIsRatingOpen(false);
    setRating(0);
    setReview("");
  };

  const handleCancelRequest = () => {
    dispatch(setActiveRide(null));
    toast({
      title: "Ride Cancelled",
      description: "Your ride request has been cancelled.",
    });
  };

  const handleExportHistory = () => {
    toast({
      title: "Export Started",
      description: "Your ride history is being downloaded.",
    });
  };

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      ride.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.dropoff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ride.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                      availableDrivers={availableDrivers}
                      locations={locations}
                      locationsLoading={locationsLoading}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {activeRequest.status !== "Cancelled" && (
                  <ActiveRideRequest
                    {...activeRequest}
                    pickup={activeRide?.pickup || ""}
                    dropoff={activeRide?.dropoff || ""}
                    availableDrivers={availableDrivers}
                    onCancel={handleCancelRequest}
                  />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Ride History
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Search rides..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-[200px]"
                        />
                        <Select onValueChange={setStatusFilter} defaultValue="all">
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleExportHistory}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block">
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
                    </div>
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious href="#" />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#" isActive>
                              1
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">2</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">3</PaginationLink>
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

            <RideDetailsModal
              ride={selectedRideDetails}
              open={isDetailsModalOpen}
              onOpenChange={setIsDetailsModalOpen}
            />
          </main>
        </div>
      </MapProvider>
    </SidebarProvider>
  );
}
