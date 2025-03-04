
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RideStatusBadge } from "./RideStatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, X, Phone, MessageSquare, AlertTriangle, Star, Check, Navigation } from "lucide-react";
import { type RideStatus, type DriverProfile } from "@/types";

export interface ActiveRideRequestProps {
  status: RideStatus;
  pickup: string;
  dropoff: string;
  driver?: DriverProfile;
  onCancel: () => void;
  onConfirmPickup?: () => void;
  onCompleteRide?: () => void;
}

export function ActiveRideRequest({
  status,
  pickup,
  dropoff,
  driver,
  onCancel,
  onConfirmPickup,
  onCompleteRide
}: ActiveRideRequestProps) {
  const renderStatusContent = () => {
    switch (status) {
      case 'requested':
      case 'finding_driver':
        return (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mt-4">
            <p className="text-yellow-800">Looking for available drivers nearby...</p>
          </div>
        );

      case 'driver_assigned':
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
            <p className="text-blue-800">Your driver is on the way to pick you up.</p>
          </div>
        );

      case 'arrived_at_pickup':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-green-800 font-medium">Your driver has arrived!</p>
              <p className="text-green-700 text-sm mt-1">Please meet at the pickup location.</p>
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={onConfirmPickup}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Pickup
            </Button>
          </div>
        );

      case 'in_progress':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-blue-800">Your ride is in progress</p>
              <div className="flex items-center gap-2 mt-2">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">En route to destination</span>
              </div>
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={onCompleteRide}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Arrival & Complete Ride
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RideStatusBadge status={status} animated />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated arrival: 10 minutes</span>
                </div>
              </div>
              {['requested', 'finding_driver', 'driver_assigned'].includes(status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
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

            {renderStatusContent()}

            {driver && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={driver.profile_picture_url} alt={driver.full_name} />
                      <AvatarFallback>{driver.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{driver.full_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary"
                      onClick={() => window.location.href = `tel:${driver.phone_number}`}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Contact: {driver.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
