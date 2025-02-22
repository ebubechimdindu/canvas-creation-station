import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Navigation2, MapPin } from "lucide-react";
import { type CampusLocation } from "@/types/locations";
import RideMap from "@/components/map/RideMap";
import { type Driver } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useStudentLocation } from '@/hooks/use-student-location';
import { useDriverMatching } from '@/hooks/use-driver-matching';
import { useMap } from '@/components/map/MapProvider';
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RideRequestFormProps {
  onSubmit: (formData: {
    pickup: CampusLocation;
    dropoff: CampusLocation;
    notes?: string;
    specialRequirements?: string;
  }) => Promise<void>;
  onCancel: () => void;
  availableDrivers?: Driver[];
  locations: CampusLocation[];
  locationsLoading: boolean;
}

export function RideRequestForm({
  onSubmit,
  onCancel,
  availableDrivers,
  locations = [],
  locationsLoading
}: RideRequestFormProps) {
  const [rideRequest, setRideRequest] = React.useState({
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    notes: "",
    recurring: false,
    specialRequirements: "",
  });

  const [selectedPickupLocation, setSelectedPickupLocation] = React.useState<CampusLocation | null>(null);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = React.useState<CampusLocation | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = React.useState(false);

  const { mapboxToken } = useMap();
  const { currentLocation, error: locationError, isLoading: locationLoading, updateLocation, isWithinCampus } = useStudentLocation(mapboxToken);
  const { toast } = useToast();
  const { nearbyDrivers, isLoading: driversLoading } = useDriverMatching({
    pickupLocation: selectedPickupLocation?.coordinates
  });

  React.useEffect(() => {
    console.log('Selected Locations:', {
      pickup: selectedPickupLocation,
      dropoff: selectedDropoffLocation
    });
  }, [selectedPickupLocation, selectedDropoffLocation]);

  const handleCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;
        
        if (!isWithinCampus(latitude, longitude)) {
          toast({
            title: "Location Outside Campus",
            description: "Your current location is outside the campus boundaries. Please select a pickup location within campus.",
            variant: "destructive",
          });
          setUseCurrentLocation(false);
          return;
        }

        await updateLocation(latitude, longitude);
        
        if (currentLocation) {
          const newPickupLocation: CampusLocation = {
            id: 'current-location',
            name: 'Current Location',
            coordinates: {
              lat: latitude,
              lng: longitude
            },
            description: currentLocation.address,
            locationType: 'pickup_point',
            isActive: true,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setSelectedPickupLocation(newPickupLocation);
          setUseCurrentLocation(true);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your current location. Please select manually.',
          variant: 'destructive',
        });
        setUseCurrentLocation(false);
      }
    }
  };

  const handleLocationSelect = (location: CampusLocation, type: 'pickup' | 'dropoff') => {
    console.log(`Handling ${type} location selection:`, location);

    if (!isWithinCampus(location.coordinates.lat, location.coordinates.lng)) {
      toast({
        title: "Invalid Location",
        description: `The selected ${type} location is outside campus boundaries.`,
        variant: "destructive",
      });
      return;
    }

    if (type === 'pickup') {
      setSelectedPickupLocation(location);
      setUseCurrentLocation(false);
    } else {
      setSelectedDropoffLocation(location);
    }
  };

  const isValidRequest = () => {
    if (!selectedPickupLocation || !selectedDropoffLocation) {
      console.log('Missing locations:', { 
        pickup: selectedPickupLocation, 
        dropoff: selectedDropoffLocation 
      });
      return false;
    }
    
    const pickupValid = isWithinCampus(
      selectedPickupLocation.coordinates.lat,
      selectedPickupLocation.coordinates.lng
    );
    const dropoffValid = isWithinCampus(
      selectedDropoffLocation.coordinates.lat,
      selectedDropoffLocation.coordinates.lng
    );
    
    console.log('Location validation:', { pickupValid, dropoffValid });
    return pickupValid && dropoffValid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidRequest() || !selectedPickupLocation || !selectedDropoffLocation) {
      toast({
        title: "Invalid Locations",
        description: "Please ensure both pickup and dropoff locations are selected and within campus boundaries",
        variant: "destructive",
      });
      return;
    }

    await onSubmit({
      pickup: selectedPickupLocation,
      dropoff: selectedDropoffLocation,
      notes: rideRequest.notes,
      specialRequirements: rideRequest.specialRequirements
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Click on the map to select your pickup and dropoff locations. Select pickup location first, then dropoff location.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selected Locations</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex gap-2 items-center"
                onClick={handleCurrentLocation}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={rideRequest.date}
                onChange={(e) =>
                  setRideRequest({ ...rideRequest, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={rideRequest.time}
                onChange={(e) =>
                  setRideRequest({ ...rideRequest, time: e.target.value })
                }
                required
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Label>Location Selection Map</Label>
          <div className="h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <RideMap
              pickup={selectedPickupLocation?.name || ""}
              dropoff={selectedDropoffLocation?.name || ""}
              showRoutePath={true}
              mode="student"
              nearbyDrivers={availableDrivers?.map(driver => ({
                lat: driver.currentLocation?.lat || 0,
                lng: driver.currentLocation?.lng || 0
              })).filter(loc => loc.lat !== 0 && loc.lng !== 0)}
              onLocationSelect={handleLocationSelect}
              selectedLocations={{
                pickup: selectedPickupLocation,
                dropoff: selectedDropoffLocation
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequirements">Special Requirements</Label>
        <Select
          onValueChange={(value) =>
            setRideRequest({
              ...rideRequest,
              specialRequirements: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select any special requirements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
            <SelectItem value="assistant">Need Assistant</SelectItem>
            <SelectItem value="luggage">Extra Luggage Space</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions or notes for the driver?"
          value={rideRequest.notes}
          onChange={(e) =>
            setRideRequest({ ...rideRequest, notes: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Available Drivers Nearby</Label>
        <div className="p-4 rounded-lg border bg-muted">
          {driversLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Finding nearby drivers...</span>
            </div>
          ) : nearbyDrivers && nearbyDrivers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">{nearbyDrivers.length} drivers nearby</Badge>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={!isValidRequest()}
        >
          Request Ride
        </Button>
      </div>
    </form>
  );
}

export default RideRequestForm;
