
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
import { Loader2, Navigation2 } from "lucide-react";
import { type CampusLocation } from "@/types/locations";
import RideMap from "@/components/map/RideMap";
import { type Driver } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useStudentLocation } from '@/hooks/use-student-location';
import { useMap } from '@/components/map/MapProvider';
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

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

  // Debug logs to track state changes
  React.useEffect(() => {
    console.log('Pickup Location:', selectedPickupLocation);
    console.log('Dropoff Location:', selectedDropoffLocation);
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

          toast({
            title: "Location Updated",
            description: "Your current location has been set as the pickup point",
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your current location. Please select manually from the map.',
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

  const handleLocationSelect = (location: CampusLocation, type: 'pickup' | 'dropoff') => {
    console.log(`Handling ${type} location selection:`, location);

    if (!isWithinCampus(location.coordinates.lat, location.coordinates.lng)) {
      toast({
        title: "Invalid Location",
        description: `The selected ${type} location is outside campus boundaries. Please select a location within campus.`,
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

    // Provide immediate feedback on location selection
    toast({
      title: "Location Selected",
      description: `${type === 'pickup' ? 'Pickup' : 'Dropoff'} location set to ${location.name}`,
    });
  };

  const isValidRequest = React.useCallback(() => {
    if (!selectedPickupLocation || !selectedDropoffLocation) {
      console.log('Missing locations:', { pickup: !!selectedPickupLocation, dropoff: !!selectedDropoffLocation });
      return false;
    }
    
    const pickupValid = isWithinCampus(selectedPickupLocation.coordinates.lat, selectedPickupLocation.coordinates.lng);
    const dropoffValid = isWithinCampus(selectedDropoffLocation.coordinates.lat, selectedDropoffLocation.coordinates.lng);
    
    console.log('Location validation:', { pickupValid, dropoffValid });
    return pickupValid && dropoffValid;
  }, [selectedPickupLocation, selectedDropoffLocation, isWithinCampus]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidRequest()) {
      toast({
        title: "Invalid Locations",
        description: "Please ensure both pickup and dropoff locations are within campus boundaries",
        variant: "destructive",
      });
      return;
    }

    await onSubmit(e);
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
