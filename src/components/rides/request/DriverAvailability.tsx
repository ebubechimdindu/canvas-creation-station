
import React from "react";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Star, Phone } from "lucide-react";
import type { Driver } from "@/types";

interface DriverAvailabilityProps {
  driversLoading: boolean;
  nearbyDrivers: Driver[];
  onSelectDriver?: (driver: Driver) => void;
}

export function DriverAvailability({
  driversLoading,
  nearbyDrivers,
  onSelectDriver
}: DriverAvailabilityProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base">Available Drivers Nearby</Label>
      
      {driversLoading ? (
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Finding nearby drivers...</span>
        </div>
      ) : nearbyDrivers.length > 0 ? (
        <div className="space-y-3">
          {nearbyDrivers.map((driver) => (
            <Card key={driver.id} className="p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {driver.profilePictureUrl ? (
                      <AvatarImage src={driver.profilePictureUrl} alt={driver.name} />
                    ) : (
                      <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{driver.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span>{driver.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{(driver.distance / 1000).toFixed(1)}km away</span>
                      </div>
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${driver.phoneNumber || '+'}`}
                  className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                  title="Call driver"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
          <p className="text-sm text-muted-foreground text-center">
            Average pickup time: 3-5 minutes
          </p>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            No drivers available nearby. Please try again later.
          </p>
        </div>
      )}
    </div>
  );
}
