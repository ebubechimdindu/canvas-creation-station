
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Clock, X } from "lucide-react";
import RideMap from "@/components/map/RideMap";
import { type Driver } from "@/types";

interface ActiveRideRequestProps {
  status: string;
  estimatedWait: string;
  nearbyDrivers: number;
  pickup: string;
  dropoff: string;
  availableDrivers?: Driver[];
  onCancel: () => void;
}

export function ActiveRideRequest({
  status,
  estimatedWait,
  nearbyDrivers,
  pickup,
  dropoff,
  availableDrivers,
  onCancel
}: ActiveRideRequestProps) {
  return (
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
                <AlertDialogAction onClick={onCancel}>
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
              <span className="font-medium">{status}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Wait:</span>
              <span className="font-medium">{estimatedWait}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nearby Drivers:</span>
              <span className="font-medium">{nearbyDrivers}</span>
            </div>
          </div>
          <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden">
            <RideMap
              pickup={pickup}
              dropoff={dropoff}
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
  );
}
