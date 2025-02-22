
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Navigation2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { type CampusLocation } from "@/types/locations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin } from "lucide-react";
import RideMap from "@/components/map/RideMap";

interface LocationSelectorProps {
  selectedPickupLocation: CampusLocation | null;
  selectedDropoffLocation: CampusLocation | null;
  onLocationSelect: (location: CampusLocation, type: 'pickup' | 'dropoff') => void;
  onCurrentLocation: () => void;
  locationLoading: boolean;
  availableDrivers?: { lat: number; lng: number; }[];
}

export function LocationSelector({
  selectedPickupLocation,
  selectedDropoffLocation,
  onLocationSelect,
  onCurrentLocation,
  locationLoading,
  availableDrivers,
}: LocationSelectorProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Click on the map to select your pickup and dropoff locations. Select pickup location first, then dropoff location.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Selected Locations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex gap-2 items-center"
            onClick={onCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation2 className="h-4 w-4" />
            )}
            Use Current Location
          </Button>
        </div>
        <div className="space-y-2 p-4 rounded-lg border bg-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">
              Pickup: {selectedPickupLocation?.name || "Not selected"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium">
              Dropoff: {selectedDropoffLocation?.name || "Not selected"}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[300px] md:h-[400px] rounded-lg overflow-hidden">
        <RideMap
          pickup={selectedPickupLocation?.name || ""}
          dropoff={selectedDropoffLocation?.name || ""}
          showRoutePath={true}
          mode="student"
          nearbyDrivers={availableDrivers}
          onLocationSelect={onLocationSelect}
          selectedLocations={{
            pickup: selectedPickupLocation,
            dropoff: selectedDropoffLocation
          }}
        />
      </div>
    </div>
  );
}
