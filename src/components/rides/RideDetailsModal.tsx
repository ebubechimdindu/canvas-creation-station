
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RideMap from "../map/RideMap";
import { MapPin, Calendar, Clock, User, CreditCard, MessageSquare } from "lucide-react";
import { Ride } from "@/types";
import { format } from "date-fns";

interface RideDetailsModalProps {
  ride: Ride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RideDetailsModal = ({ ride, open, onOpenChange }: RideDetailsModalProps) => {
  if (!ride) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Ride Details</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Trip Information</h3>
              <div className="grid gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-muted-foreground">{ride.pickup}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dropoff Location</p>
                    <p className="text-muted-foreground">{ride.dropoff}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(ride.date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(ride.date), "hh:mm a")}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Driver Information</h3>
              <div className="grid gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{ride.driver}</span>
                </div>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Driver
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Payment Details</h3>
              <div className="grid gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Payment Method: Cash</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Status: Paid</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <RideMap 
              pickup={ride.pickup}
              dropoff={ride.dropoff}
              className="h-[300px]"
            />
            
            {ride.status === "Completed" && !ride.rating && (
              <div className="space-y-2">
                <h3 className="font-semibold">Rate Your Ride</h3>
                <Button className="w-full">Rate Now</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideDetailsModal;
