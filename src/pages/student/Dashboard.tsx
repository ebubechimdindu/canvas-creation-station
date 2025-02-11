
import { useState } from "react";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { MapPin, Calendar, Clock, Activity, Car, X } from "lucide-react";
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

const StudentDashboard = () => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<{
    status: string;
    estimatedWait: string;
    nearbyDrivers: number;
  } | null>(null);
  const { toast } = useToast();
  const [rideRequest, setRideRequest] = useState({
    pickup: "",
    dropoff: "",
    notes: "",
    specialRequirements: "",
  });

  const handleRideRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveRequest({
      status: "Searching for driver",
      estimatedWait: "5-10 minutes",
      nearbyDrivers: 3,
    });
    toast({
      title: "Ride Requested",
      description: "Looking for available drivers...",
    });
    setIsRequestOpen(false);
  };

  const handleCancelRequest = () => {
    setActiveRequest(null);
    toast({
      title: "Ride Cancelled",
      description: "Your ride request has been cancelled.",
    });
  };

  const handleDriverRequest = (driverName: string) => {
    setActiveRequest({
      status: `Requesting ${driverName}`,
      estimatedWait: "2-5 minutes",
      nearbyDrivers: 1,
    });
    toast({
      title: "Driver Requested",
      description: `Sending request to ${driverName}...`,
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                <DialogTrigger asChild>
                  <Button className={navigationMenuTriggerStyle()}>
                    Book a Ride
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Request a Ride</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRideRequest} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pickup">Pickup Location</Label>
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
                              setRideRequest({
                                ...rideRequest,
                                dropoff: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Location Preview</Label>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F1F0FB] border">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <MapPin className="h-8 w-8 text-[#8E9196] mx-auto" />
                              <p className="text-sm text-[#8E9196]">
                                Select a location to preview
                              </p>
                            </div>
                          </div>
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
                        </div>
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
                        <SelectTrigger>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <QuickStat
                title="Active Rides"
                value={activeRequest ? "1" : "0"}
                icon={<Activity className="h-6 w-6" />}
                trend="+5% from last week"
              />
              <QuickStat
                title="Total Rides"
                value="24"
                icon={<MapPin className="h-6 w-6" />}
                trend="+12% from last month"
              />
              <QuickStat
                title="This Month"
                value="8"
                icon={<Calendar className="h-6 w-6" />}
                trend="-2% from last month"
              />
              <QuickStat
                title="Avg. Wait Time"
                value="5min"
                icon={<Clock className="h-6 w-6" />}
                trend="Same as last week"
              />
            </div>

            {activeRequest && (
              <Card className="mb-8 border-l-4 border-l-blue-500">
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
                            Are you sure you want to cancel your current ride
                            request? This action cannot be undone.
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
                    <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden bg-[#F1F0FB] border">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Car className="h-8 w-8 text-[#8E9196] mx-auto animate-pulse" />
                          <p className="text-sm text-[#8E9196]">
                            Searching for nearby drivers...
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Recent Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((ride) => (
                      <div
                        key={ride}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                      >
                        <div>
                          <p className="font-medium">Campus Library → Dorm B</p>
                          <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Available Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 1, name: "John D.", rating: 4.8, distance: 3 },
                      { id: 2, name: "Sarah M.", rating: 4.9, distance: 5 },
                      { id: 3, name: "Mike R.", rating: 4.7, distance: 7 },
                    ].map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-500">
                            {driver.rating} ★ • {driver.distance} min away
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDriverRequest(driver.name)}
                          disabled={activeRequest !== null}
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
  <Card className="animate-fade-in">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{trend}</div>
    </CardContent>
  </Card>
);

export default StudentDashboard;
