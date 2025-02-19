
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRideRequests } from '@/hooks/use-ride-requests';
import { useCampusLocations } from '@/hooks/use-campus-locations';
import RideRequestForm from '@/components/rides/RideRequestForm';
import RideHistoryTable from '@/components/rides/RideHistoryTable';
import ActiveRideRequest from '@/components/rides/ActiveRideRequest';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { type CampusLocation } from '@/types/locations';

export default function Rides() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { locations, isLoading: isLoadingLocations } = useCampusLocations();
  const { 
    activeRide,
    isLoadingActive,
    createRideRequest,
    cancelRideRequest,
    rideHistory,
    isLoadingHistory,
    isCreating
  } = useRideRequests();

  // Handle incoming state from Dashboard
  useEffect(() => {
    if (location.state?.openRideRequest) {
      setIsRequestOpen(true);
      // Clear the state after using it
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const handleCreateRide = async (formData: {
    pickup: CampusLocation;
    dropoff: CampusLocation;
    notes?: string;
    specialRequirements?: string;
  }) => {
    try {
      // Validate coordinates before submitting
      if (!formData.pickup?.coordinates || !formData.dropoff?.coordinates) {
        throw new Error('Invalid pickup or dropoff location');
      }

      await createRideRequest(formData);
      setIsRequestOpen(false);
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error; // Let the form handle the error
    }
  };

  if (isLoadingActive || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {activeRide ? (
        <ActiveRideRequest
          ride={activeRide}
          onCancel={() => cancelRideRequest(activeRide.id)}
        />
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setIsRequestOpen(true)}>Request Ride</Button>
        </div>
      )}

      <Sheet open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Request a Ride</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <RideRequestForm
              onSubmit={handleCreateRide}
              onCancel={() => setIsRequestOpen(false)}
              locations={locations}
              locationsLoading={isLoadingLocations}
            />
          </div>
        </SheetContent>
      </Sheet>

      <RideHistoryTable 
        rides={rideHistory} 
        isLoading={isLoadingHistory}
      />
    </div>
  );
}
