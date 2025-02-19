
import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";
import { RideStatusBadge } from "./RideStatusBadge";
import { type RideRequest } from "@/types";
import { Loader2 } from "lucide-react";

interface RideHistoryTableProps {
  rides: RideRequest[];
  isLoading?: boolean;
}

export function RideHistoryTable({ rides, isLoading }: RideHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rides.map((ride) => (
        <Card key={ride.id} className="w-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(ride.created_at), "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center gap-2">
                    <RideStatusBadge status={ride.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{ride.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{ride.dropoff_address}</span>
                  </div>
                </div>

                {ride.driver && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Driver: </span>
                    <span className="font-medium">{ride.driver.full_name}</span>
                  </div>
                )}

                {ride.ratings && ride.ratings.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{ride.ratings[0].rating}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {rides.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No ride history available
        </div>
      )}
    </div>
  );
}
