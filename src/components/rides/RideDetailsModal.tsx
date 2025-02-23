
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import type { RideRequest } from "@/types";

interface RideDetailsModalProps {
  ride: RideRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

const RideDetailsModal: React.FC<RideDetailsModalProps> = ({
  ride,
  isOpen,
  onClose,
}) => {
  if (!ride) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ride Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{ride.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(ride.created_at), "MMM dd, yyyy HH:mm")}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>{ride.pickup_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{ride.dropoff_address}</span>
            </div>
          </div>

          {ride.driver && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Driver Information
              </h4>
              <p className="text-sm">{ride.driver.full_name}</p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {ride.driver.phone_number}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideDetailsModal;
