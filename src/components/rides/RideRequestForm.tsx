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
import { LocationCombobox } from "@/components/locations/LocationCombobox";
import { Loader2, Navigation2 } from "lucide-react";
import { type CampusLocation } from "@/types/locations";
import RideMap from "@/components/map/RideMap";
import { type Driver } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useStudentLocation } from '@/hooks/use-student-location';
import { useMap } from '@/components/map/MapProvider';
import { format } from "date-fns";

interface RideRequestFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
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
    pickup: "",
    dropoff: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    notes: "",
    recurring: false,
    specialRequirements: "",
  });

  const [selectedPickupLocation, setSelectedPickupLocation] = React.useState<CampusLocation | null>(null);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = React.useState<CampusLocation | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = React.useState(true);

  const { mapboxToken } = useMap();
  const { currentLocation, error: locationError, isLoading: locationLoading, updateLocation } = useStudentLocation(mapboxToken);
  const { toast } = useToast();

  const safeLocations = React.useMemo(() => {
    return Array.isArray(locations) ? locations : [];
  }, [locations]);

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
        await updateLocation(latitude, longitude);
        
        if (currentLocation) {
          setRideRequest(prev => ({
            ...prev,
            pickup: currentLocation.address,
            pickupLocation: {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              address: currentLocation.address
            }
          }));

          setSelectedPickupLocation({
            id: 'current-location',
            name: 'Current Location',
            coordinates: {
              lat: currentLocation.lat,
              lng: currentLocation.lng
            },
            description: currentLocation.address,
            locationType: 'pickup_point',
            isActive: true,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          setUseCurrentLocation(true);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your current location. Please try selecting manually.',
          variant: 'destructive',
        });
        setUseCurrentLocation(false);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      setUseCurrentLocation(false);
    }
  };

  const handlePickupLocationSelect = (location: CampusLocation) => {
    setSelectedPickupLocation(location);
    setRideRequest(prev => ({
      ...prev,
      pickup: location.name,
      pickupLocation: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        address: location.name
      }
    }));
    setUseCurrentLocation(false);
  };

  const handleDropoffLocationSelect = (location: CampusLocation) => {
    setSelectedDropoffLocation(location);
    setRideRequest(prev => ({
      ...prev,
      dropoff: location.name,
      dropoffLocation: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        address: location.name
      }
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Location</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <LocationCombobox
                  value={selectedPickupLocation?.name || ""}
                  onSelect={handlePickupLocationSelect}
                  locations={safeLocations}
                  placeholder="Select pickup location"
                  isLoading={locationsLoading}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="flex gap-2 items-center"
                onClick={handleCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation2 className="h-4 w-4" />
                )}
                {locationLoading ? "Getting Location..." : "Use Current"}
              </Button>
            </div>
            {locationError && (
              <p className="text-sm text-destructive mt-1">
                Error getting location: {locationError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dropoff">Dropoff Location</Label>
            <LocationCombobox
              value={selectedDropoffLocation?.name || ""}
              onSelect={handleDropoffLocationSelect}
              locations={safeLocations}
              placeholder="Select dropoff location"
              isLoading={locationsLoading}
            />
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
          <Label>Location Preview</Label>
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
          placeholder="Any special requirements?"
          value={rideRequest.notes}
          onChange={(e) =>
            setRideRequest({ ...rideRequest, notes: e.target.value })
          }
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">Request Ride</Button>
      </div>
    </form>
  );
}

export default RideRequestForm;
