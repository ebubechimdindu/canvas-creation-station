
import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface DriverAvailabilityProps {
  driversLoading: boolean;
  nearbyDriversCount: number;
}

export function DriverAvailability({
  driversLoading,
  nearbyDriversCount,
}: DriverAvailabilityProps) {
  return (
    <div className="space-y-2">
      <Label>Available Drivers Nearby</Label>
      <div className="p-4 rounded-lg border bg-muted">
        {driversLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Finding nearby drivers...</span>
          </div>
        ) : nearbyDriversCount > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success">{nearbyDriversCount} drivers nearby</Badge>
              <span className="text-sm text-muted-foreground">
                Average pickup time: 3-5 minutes
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            No drivers available nearby. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
}
