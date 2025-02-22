import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CampusLocation } from "@/types/locations";
import { useToast } from "@/hooks/use-toast";
import { useStudentLocation } from '@/hooks/use-student-location';
import { useDriverMatching } from '@/hooks/use-driver-matching';
import { useMap } from '@/components/map/MapProvider';
import { format } from "date-fns";
import { LocationSelector } from "./request/LocationSelector";
import { TimeSelector } from "./request/TimeSelector";
import { DriverAvailability } from "./request/DriverAvailability";

interface RideRequestFormProps {
  onSubmit: (formData: {
    pickup: CampusLocation;
    dropoff: CampusLocation;
    notes?: string;
    specialRequirements?: string;
  }) => Promise<void>;
  onCancel: () => void;
  locations: CampusLocation[];
  locationsLoading: boolean;
}

export function RideRequestForm({
  onSubmit,
  onCancel,
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
      <LocationSelector
        selectedPickupLocation={selectedPickupLocation}
        selectedDropoffLocation={selectedDropoffLocation}
        onLocationSelect={handleLocationSelect}
        onCurrentLocation={handleCurrentLocation}
        locationLoading={locationLoading}
        availableDrivers={nearbyDrivers?.map(driver => ({
          lat: driver.currentLocation?.lat || 0,
          lng: driver.currentLocation?.lng || 0
        }))}
      />

      <TimeSelector
        date={rideRequest.date}
        time={rideRequest.time}
        onDateChange={(date) => setRideRequest({ ...rideRequest, date })}
        onTimeChange={(time) => setRideRequest({ ...rideRequest, time })}
      />

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

      <DriverAvailability
        driversLoading={driversLoading}
        nearbyDrivers={nearbyDrivers || []}
      />

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
