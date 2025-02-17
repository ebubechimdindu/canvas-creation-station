import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActiveRide, addToHistory, updateDrivers } from "@/features/rides/ridesSlice";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import { useCampusLocations } from "@/hooks/use-campus-locations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Star, MessageSquare, Clock, Car, Search, Filter, Download, X, Loader2, Navigation2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/components/map/MapProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import RideMap from "@/components/map/RideMap";
import { type CampusLocation } from "@/types/locations";
import { LocationCombobox } from "@/components/locations/LocationCombobox";
import { useStudentLocation } from '@/hooks/use-student-location';
import { useMap } from '@/components/map/MapProvider';

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
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const { locations = [], isLoading: locationsLoading } = useCampusLocations();
  const [selectedRide, setSelectedRide] = useState<number | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [review, setReview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { toast } = useToast();
  const [rideRequest, setRideRequest] = useState({
    pickup: "",
    dropoff: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    notes: "",
    recurring: false,
    specialRequirements: "",
  });
  const [activeRequest, setActiveRequest] = useState({
    status: "Searching for driver",
    estimatedWait: "5-10 minutes",
    nearbyDrivers: 3,
  });
  const [selectedRideDetails, setSelectedRideDetails] = useState<typeof rides[0] | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedPickupLocation, setSelectedPickupLocation] = useState<CampusLocation | null>(null);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<CampusLocation | null>(null);

  const { mapboxToken } = useMap();
  const { currentLocation, error: locationError, isLoading: locationLoading, updateLocation } = useStudentLocation(mapboxToken);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  const handleLocationSelect = (type: 'pickup' | 'dropoff', location: string) => {
    setRideRequest(prev => ({
      ...prev,
      [type]: location
    }));
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Location Selected`,
      description: location,
    });
  };

  const handleCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;
        await updateLocation(latitude, longitude);
        
        if (currentLocation) {
          setRideRequest(prev => ({
            ...prev,
            pickup: currentLocation.address,
            pickupLocation: {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              address: currentLocation.address
            }
          }));

          setSelectedPickupLocation({
            id: 'current-location',
            name: 'Current Location',
            coordinates: {
              lat: currentLocation.lat,
              lng: currentLocation.lng
            },
            description: currentLocation.address,
            locationType: 'pickup_point',
            isActive: true,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          setUseCurrentLocation(true);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your current location. Please try selecting manually.',
          variant: 'destructive',
        });
        setUseCurrentLocation(false);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      setUseCurrentLocation(false);
    }
  };

  const handlePickupLocationSelect = (location: CampusLocation) => {
    setSelectedPickupLocation(location);
    setRideRequest(prev => ({
      ...prev,
      pickup: location.name,
      pickupLocation: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        address: location.name
      }
    }));
    setUseCurrentLocation(false);
  };

  const handleDropoffLocationSelect = (location: CampusLocation) => {
    setSelectedDropoffLocation(location);
    setRideRequest(prev => ({
      ...prev,
      dropoff: location.name,
      dropoffLocation: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        address: location.name
      }
    }));
  };

  const handleRideRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPickupLocation || !selectedDropoffLocation) {
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
        pickup: selectedPickupLocation.name,
        dropoff: selectedDropoffLocation.name,
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
                    <form onSubmit={handleRideRequest} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="pickup">Pickup Location</Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <LocationCombobox
                                  value={selectedPickupLocation?.name || ""}
                                  onSelect={handlePickupLocationSelect}
                                  locations={locations || []}
                                  placeholder="Select pickup location"
                                  isLoading={locationsLoading}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex gap-2 items-center"
                                onClick={handleCurrentLocation}
                                disabled={locationLoading}
                              >
                                {locationLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Navigation2 className="h-4 w-4" />
                                )}
                                {locationLoading ? "Getting Location..." : "Use Current"}
                              </Button>
                            </div>
                            {locationError && (
                              <p className="text-sm text-destructive mt-1">
                                Error getting location: {locationError}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dropoff">Dropoff Location</Label>
                            <LocationCombobox
                              value={selectedDropoffLocation?.name || ""}
                              onSelect={handleDropoffLocationSelect}
                              locations={locations || []}
                              placeholder="Select dropoff location"
                              isLoading={locationsLoading}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="date">Date</Label>
                              <Input
                                id="date"
                                type="date"
                                value={rideRequest.date}
                                onChange={(e) =>
                                  setRideRequest({ ...rideRequest, date: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="time">Time</Label>
                              <Input
                                id="time"
                                type="time"
                                value={rideRequest.time}
                                onChange={(e) =>
                                  setRideRequest({ ...rideRequest, time: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label>Location Preview</Label>
                          <div className="h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                            <RideMap
                              pickup={selectedPickupLocation?.name || ""}
                              dropoff={selectedDropoffLocation?.name || ""}
                              showRoutePath={true}
                              mode="student"
                              nearbyDrivers={availableDrivers?.map(driver => ({
                                lat: driver.currentLocation?.lat || 0,
                                lng: driver.currentLocation?.lng || 0
                              })).filter(loc => loc.lat !== 0 && loc.lng !== 0)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialRequirements">Special Requirements</Label>
                        <Select
                          onValueChange={(value) =>
                            setRideRequest({
                              ...rideRequest,
                              specialRequirements: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select any special requirements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
                            <SelectItem value="assistant">Need Assistant</SelectItem>
                            <SelectItem value="luggage">Extra Luggage Space</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requirements?"
                          value={rideRequest.notes}
                          onChange={(e) =>
                            setRideRequest({ ...rideRequest, notes: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsRequestOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Request Ride</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {activeRequest.status !== "Cancelled" && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 animate-pulse text-blue-500" />
                          Active Request
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Ride Request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your current ride request?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Request</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCancelRequest}>
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
                            <span className="text-muted-foreground">Estimated Wait:</span>
                            <span className="font-medium">{activeRequest.estimatedWait}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Nearby Drivers:</span>
                            <span className="font-medium">{activeRequest.nearbyDrivers}</span>
                          </div>
                        </div>
                        <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden">
                          <RideMap
                            pickup={rideRequest.pickup}
                            dropoff={rideRequest.dropoff}
                            className="w-full h-full"
                            showRoutePath={true}
                            mode="student"
                            nearbyDrivers={availableDrivers?.map(driver => ({
                              lat: driver.currentLocation?.lat || 0,
                              lng: driver.currentLocation?.lng || 0
                            })).filter(loc => loc.lat !== 0 && loc.lng !== 0)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                    <div className="md:hidden">
                      {filteredRides.map((ride) => (
                        <div
                          key={ride.id}
                          className="mb-4 rounded-lg border p-4 space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => {
                            setSelectedRideDetails(ride);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{format(new Date(ride.date), "MMM dd, yyyy")}</div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                ride.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {ride.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {ride.pickup} → {ride.dropoff}
                            </div>
                            <div className="text-muted-foreground">
                              Driver: {ride.driver}
                            </div>
                            {ride.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{ride.rating}</span>
                              </div>
                            ) : (
                              ride.status === "Completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRide(ride.id);
                                    setIsRatingOpen(true);
                                  }}
                                >
                                  Rate Ride
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Pickup</TableHead>
                            <TableHead>Dropoff</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRides.map((ride) => (
                            <TableRow 
                              key={ride.id}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => {
                                setSelectedRideDetails(ride);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              <TableCell>{format(new Date(ride.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {ride.pickup}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {ride.dropoff}
                                </div>
                              </TableCell>
                              <TableCell>{ride.driver}</TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    ride.status === "Completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {ride.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {ride.rating ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>{ride.rating}</span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRideDetails(ride);
                                      setIsDetailsModalOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  {ride.status === "Completed" && !ride.rating && (
                                    <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRide(ride.id);
                                          }}
                                        >
                                          <Star className="h-4 w-4" />
                                          Rate
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Rate Your Ride</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <div className="flex justify-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <button
                                                key={star}
                                                type="button"
                                                className="p-0 hover:scale-110 transition-transform"
                                                onMouseEnter={() => setRatingHover(star)}
                                                onMouseLeave={() => setRatingHover(0)}
                                                onClick={() => setRating(star)}
                                              >
                                                <Star
                                                  className={cn(
                                                    "h-8 w-8",
                                                    (rating >= star || ratingHover >= star) &&
                                                      "fill-yellow-400 text-yellow-400"
                                                  )}
                                                />
                                              </button>
                                            ))}
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="review">Your Review</Label>
                                            <Textarea
                                              id="review"
                                              placeholder="How was your ride?"
                                              value={review}
                                              onChange={(e) => setReview(e.target.value)}
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            variant="outline"
                                            onClick={() => setIsRatingOpen(false)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => handleRating(selectedRide!)}
                                            disabled={!rating}
                                          >
                                            Submit Rating
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
