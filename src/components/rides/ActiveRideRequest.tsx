
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RideStatusBadge } from "./RideStatusBadge";
import { MapPin, Clock, X } from "lucide-react";
import { type RideStatus, type DriverProfile } from "@/types";

export interface ActiveRideRequestProps {
  status: RideStatus;
  pickup: string;
  dropoff: string;
  driver?: DriverProfile;
  onCancel: () => void;
}

export function ActiveRideRequest({
  status,
  pickup,
  dropoff,
  driver,
  onCancel
}: ActiveRideRequestProps) {
  return (
    <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RideStatusBadge status={status} />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated arrival: 10 minutes</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="font-medium">{pickup}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="font-medium">{dropoff}</span>
              </div>
            </div>

            {driver && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Driver Details</h4>
                <p>{driver.full_name}</p>
                <p className="text-sm text-muted-foreground">{driver.phone_number}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
