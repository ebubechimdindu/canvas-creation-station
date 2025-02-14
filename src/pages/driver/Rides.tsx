
import { useState } from "react";
import { useAppSelector } from "@/hooks/redux";
import { useToast } from "@/hooks/use-toast";
import DriverSidebar from "@/components/driver/DriverSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { RideStatusBadge } from "@/components/rides/RideStatusBadge";
import { SearchFilters } from "@/components/rides/SearchFilters";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import { useAppDispatch } from "@/hooks/redux";
import { markPaymentReceived } from "@/features/rides/ridesSlice";
import type { Ride } from "@/types";
import { useLocationUpdates } from "@/hooks/use-location-updates";
import RideMap from "@/components/map/RideMap";

const DriverRides = () => {
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Ride['status'] | 'all'>('all');
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: "",
    date: null,
    status: "all"
  });

  const { toast } = useToast();
  const rides = useAppSelector((state) => state.rides.history);
  const dispatch = useAppDispatch();

  // Get real-time driver locations
  const { nearbyDrivers, error: locationError } = useLocationUpdates('all-drivers');

  const filteredRides = rides.filter(ride => {
    const matchesStatus = searchFilters.status === 'all' || ride.status === searchFilters.status;
    const matchesSearch = searchFilters.searchTerm
      ? ride.pickup.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        ride.dropoff.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      : true;
    const matchesDate = searchFilters.date
      ? new Date(ride.date).toDateString() === new Date(searchFilters.date).toDateString()
      : true;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const updateRideStatus = (rideId: number, newStatus: Ride['status']) => {
    toast({
      title: "Status Updated",
      description: `Ride #${rideId} status has been updated to ${newStatus}`,
    });
  };

  const handlePaymentReceived = (rideId: number) => {
    dispatch(markPaymentReceived(rideId));
    toast({
      title: "Payment Marked as Received",
      description: "The ride payment has been marked as received.",
    });
  };

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride);
    setShowDetailsModal(true);
  };

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
    toast({
      title: "Filters Applied",
      description: "The ride list has been updated based on your filters.",
    });
  };

  const handleResetFilters = () => {
    setSearchFilters({
      searchTerm: "",
      date: null,
      status: "all"
    });
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    });
  };

  if (locationError) {
    toast({
      title: "Location Error",
      description: "Failed to load driver locations. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DriverSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rides Management</h1>
              <p className="text-gray-600">View and manage your rides</p>
            </div>
          </div>

          {/* Map View */}
          <Card>
            <CardHeader>
              <CardTitle>Live Map View</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <RideMap
                pickup=""
                dropoff=""
                className="w-full h-full rounded-lg"
                nearbyDrivers={nearbyDrivers}
                showNearbyRequests={true}
              />
            </CardContent>
          </Card>

          {/* Search Filters */}
          <Card>
            <CardContent className="pt-6">
              <SearchFilters
                onSearch={handleSearch}
                onReset={handleResetFilters}
              />
            </CardContent>
          </Card>

          {/* Status Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['all', 'Completed', 'Upcoming', 'In Progress', 'Cancelled'].map((status) => (
              <Card 
                key={status}
                className={`cursor-pointer transition-colors ${
                  statusFilter === status ? 'border-primary' : ''
                }`}
                onClick={() => setStatusFilter(status as typeof statusFilter)}
              >
                <CardContent className="pt-6">
                  <p className="font-semibold">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                  <p className="text-2xl font-bold mt-2">
                    {rides.filter(ride => 
                      status === 'all' ? true : ride.status === status
                    ).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rides Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Dropoff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No rides found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRides.map((ride) => (
                      <TableRow 
                        key={ride.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRideClick(ride)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {new Date(ride.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {ride.pickup}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {ride.dropoff}
                          </div>
                        </TableCell>
                        <TableCell>
                          <RideStatusBadge status={ride.status} />
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${ride.payment?.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
                          }>
                            {ride.payment?.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {ride.status === 'Completed' && ride.payment?.status === 'pending' && (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentReceived(ride.id);
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                                Mark Paid
                              </Button>
                            )}
                            {ride.status === "Upcoming" && (
                              <>
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateRideStatus(ride.id, "In Progress");
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Start
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateRideStatus(ride.id, "Cancelled");
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {ride.status === "In Progress" && (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRideStatus(ride.id, "Completed");
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <RideDetailsModal
        ride={selectedRide}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  );
};

export default DriverRides;

