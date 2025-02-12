
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar, Filter, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import RideMap from "@/components/map/RideMap";
import RideDetailsModal from "@/components/rides/RideDetailsModal";
import type { Ride } from "@/types";

const DriverRides = () => {
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Ride['status'] | 'all'>('all');

  const { toast } = useToast();
  const rides = useAppSelector((state) => state.rides.history);

  const filteredRides = rides.filter(ride => 
    statusFilter === 'all' ? true : ride.status === statusFilter
  );

  const updateRideStatus = (rideId: number, newStatus: Ride['status']) => {
    // In a real app, this would dispatch an action to update the ride status
    toast({
      title: "Status Updated",
      description: `Ride #${rideId} status has been updated to ${newStatus}`,
    });
  };

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride);
    setShowDetailsModal(true);
  };

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
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>

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
                  {filteredRides.map((ride) => (
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            ride.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            ride.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            ride.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`
                        }>
                          {ride.status}
                        </span>
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
                          {ride.status === 'Upcoming' && (
                            <>
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRideStatus(ride.id, 'In Progress');
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
                                  updateRideStatus(ride.id, 'Cancelled');
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {ride.status === 'In Progress' && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRideStatus(ride.id, 'Completed');
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
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

        <RideDetailsModal 
          ride={selectedRide}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />
      </main>
    </div>
  );
};

export default DriverRides;
