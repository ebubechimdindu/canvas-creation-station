
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
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 md:p-4 mt-3 md:mt-4">
            <p className="text-yellow-800 text-sm md:text-base">Looking for available drivers nearby...</p>
          </div>
        );

      case 'driver_assigned':
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 md:p-4 mt-3 md:mt-4">
            <p className="text-blue-800 text-sm md:text-base">Your driver is on the way to pick you up.</p>
          </div>
        );

      case 'arrived_at_pickup':
        return (
          <div className="space-y-3 md:space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 md:p-4">
              <p className="text-green-800 font-medium text-sm md:text-base">Your driver has arrived!</p>
              <p className="text-green-700 text-xs md:text-sm mt-1">Please meet at the pickup location.</p>
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-sm md:text-base py-2 md:py-3"
              onClick={onConfirmPickup}
            >
              <Check className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              Confirm Pickup
            </Button>
          </div>
        );

      case 'in_progress':
        return (
          <div className="space-y-3 md:space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 md:p-4">
              <p className="text-blue-800 text-sm md:text-base">Your ride is in progress</p>
              <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                <Navigation className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span className="text-xs md:text-sm text-blue-700">En route to destination</span>
              </div>
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-sm md:text-base py-2 md:py-3"
              onClick={onCompleteRide}
            >
              <Check className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Confirm Arrival & Complete Ride
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-md">
      <CardContent className="p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:gap-4">
          <div className="space-y-3 md:space-y-4 flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-1 md:gap-2">
                  <RideStatusBadge status={status} animated />
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-muted-foreground text-xs md:text-sm">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Estimated arrival: 10 minutes</span>
                </div>
              </div>
              {['requested', 'finding_driver', 'driver_assigned'].includes(status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 md:h-10 md:w-10"
                  onClick={onCancel}
                >
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-1 md:gap-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                <span className="font-medium text-xs md:text-sm line-clamp-1">{pickup}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                <span className="font-medium text-xs md:text-sm line-clamp-1">{dropoff}</span>
              </div>
            </div>

            {renderStatusContent()}

            {driver && (
              <div className="mt-3 md:mt-4 p-3 md:p-4 bg-muted rounded-lg space-y-3 md:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarImage src={driver.profile_picture_url} alt={driver.full_name} />
                      <AvatarFallback>{driver.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">{driver.full_name}</h4>
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-400 fill-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 md:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary h-8 w-8 md:h-9 md:w-9 p-0"
                      onClick={() => window.location.href = `tel:${driver.phone_number}`}
                    >
                      <Phone className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary h-8 w-8 md:h-9 md:w-9 p-0"
                    >
                      <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 md:h-9 md:w-9 p-0"
                    >
                      <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs md:text-sm">
                  <p className="text-muted-foreground break-all md:break-normal">Contact: {driver.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
