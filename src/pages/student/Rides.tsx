import { useState } from "react";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar, MapPin, Star, MessageSquare, Clock, Car } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Mock data for rides
const rides = [
  {
    id: 1,
    date: "2024-04-10",
    pickup: "Student Center",
    dropoff: "Library",
    driver: "John Doe",
    status: "Completed",
    rating: 4,
  },
  {
    id: 2,
    date: "2024-04-11",
    pickup: "Dorm A",
    dropoff: "Science Building",
    driver: "Jane Smith",
    status: "Upcoming",
    rating: null,
  },
  {
    id: 3,
    date: "2024-04-09",
    pickup: "Gym",
    dropoff: "Student Center",
    driver: "Mike Johnson",
    status: "Completed",
    rating: 5,
  },
];

export default function StudentRides() {
  const [selectedRide, setSelectedRide] = useState<number | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const { toast } = useToast();
  const [rideRequest, setRideRequest] = useState({
    pickup: "",
    dropoff: "",
    date: "",
    time: "",
    notes: "",
  });

  const handleRideRequest = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Ride Requested",
      description: "Looking for available drivers...",
    });
    setIsRequestOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <StudentSidebar />
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Your Rides</h1>
              <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Car className="h-5 w-5" />
                    Request a Ride
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request a Ride</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRideRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup">Pickup Location</Label>
                      <Input
                        id="pickup"
                        placeholder="Enter pickup location"
                        value={rideRequest.pickup}
                        onChange={(e) =>
                          setRideRequest({ ...rideRequest, pickup: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dropoff">Dropoff Location</Label>
                      <Input
                        id="dropoff"
                        placeholder="Enter dropoff location"
                        value={rideRequest.dropoff}
                        onChange={(e) =>
                          setRideRequest({ ...rideRequest, dropoff: e.target.value })
                        }
                        required
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
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Input
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
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Active Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No active ride requests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ride History
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      {rides.map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell>{ride.date}</TableCell>
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
                            {ride.status === "Completed" && !ride.rating && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => setSelectedRide(ride.id)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Rate
                              </Button>
                            )}
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
        </main>
      </div>
    </SidebarProvider>
  );
}
