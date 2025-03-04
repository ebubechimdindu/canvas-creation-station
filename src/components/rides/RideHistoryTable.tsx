
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Star, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type RideRequest, type RideStatus } from "@/types";

interface RideHistoryTableProps {
  rides: RideRequest[];
  onRideSelect: (ride: RideRequest) => void;
  onRateRide: (rideId: number) => void;
  isRatingOpen: boolean;
  setIsRatingOpen: (open: boolean) => void;
  rating: number;
  setRating: (rating: number) => void;
  ratingHover: number;
  setRatingHover: (rating: number) => void;
  review: string;
  setReview: (review: string) => void;
  selectedRide: number | null;
  setSelectedRide: (rideId: number) => void;
}

const getStatusDisplay = (status: RideStatus) => {
  const statusMap: Record<RideStatus, { text: string; className: string }> = {
    requested: { text: "Requested", className: "bg-blue-100 text-blue-700" },
    finding_driver: { text: "Finding Driver", className: "bg-blue-100 text-blue-700" },
    driver_assigned: { text: "Driver Assigned", className: "bg-yellow-100 text-yellow-700" },
    en_route_to_pickup: { text: "Driver En Route", className: "bg-yellow-100 text-yellow-700" },
    arrived_at_pickup: { text: "Driver Arrived", className: "bg-yellow-100 text-yellow-700" },
    in_progress: { text: "In Progress", className: "bg-green-100 text-green-700" },
    completed: { text: "Completed", className: "bg-green-100 text-green-700" },
    cancelled: { text: "Cancelled", className: "bg-red-100 text-red-700" },
    timeout: { text: "Timed Out", className: "bg-red-100 text-red-700" }
  };

  return statusMap[status] || { text: status, className: "bg-gray-100 text-gray-700" };
};

export function RideHistoryTable({
  rides,
  onRideSelect,
  onRateRide,
  isRatingOpen,
  setIsRatingOpen,
  rating,
  setRating,
  ratingHover,
  setRatingHover,
  review,
  setReview,
  selectedRide,
  setSelectedRide
}: RideHistoryTableProps) {
  return (
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
        {rides.map((ride) => {
          const hasRating = ride.ratings?.some(r => r.rated_by === ride.student_id);
          const statusDisplay = getStatusDisplay(ride.status);

          return (
            <TableRow 
              key={ride.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onRideSelect(ride)}
            >
              <TableCell>{format(new Date(ride.created_at), "MMM dd, yyyy")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {ride.pickup_address}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {ride.dropoff_address}
                </div>
              </TableCell>
              <TableCell>{ride.driver?.full_name || "-"}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusDisplay.className}`}>
                  {statusDisplay.text}
                </span>
              </TableCell>
              <TableCell>
                {hasRating ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{ride.ratings?.[0].rating}</span>
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
                      onRideSelect(ride);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {ride.status === 'completed' && !hasRating && (
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
                            onClick={() => onRateRide(selectedRide!)}
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
          );
        })}
      </TableBody>
    </Table>
  );
}
