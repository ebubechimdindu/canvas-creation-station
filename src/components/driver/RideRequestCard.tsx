
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, DollarSign } from "lucide-react";

interface RideRequestCardProps {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedEarnings: number;
  estimatedDistance: number;
  estimatedDuration: number;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

const RideRequestCard = ({
  id,
  pickupAddress,
  dropoffAddress,
  estimatedEarnings,
  estimatedDistance,
  estimatedDuration,
  onAccept,
  onReject,
}: RideRequestCardProps) => {
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>New Ride Request</span>
          <span className="text-sm font-normal text-muted-foreground">
            <Clock className="inline-block w-4 h-4 mr-1" />
            Just now
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-green-500" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-red-500" />
            <div>
              <p className="text-sm font-medium">Dropoff</p>
              <p className="text-sm text-muted-foreground">{dropoffAddress}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Distance</p>
            <p className="text-lg font-medium">{(estimatedDistance / 1000).toFixed(1)} km</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-lg font-medium">{Math.round(estimatedDuration / 60)} min</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Earnings</p>
            <p className="text-lg font-medium flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
              {estimatedEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => onReject(id)}
        >
          Reject
        </Button>
        <Button 
          className="flex-1"
          onClick={() => onAccept(id)}
        >
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RideRequestCard;
