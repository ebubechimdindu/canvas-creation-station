
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRideRequests } from '@/hooks/use-ride-requests';
import { useCampusLocations } from '@/hooks/use-campus-locations';
import { RideRequestForm } from '@/components/rides/RideRequestForm';
import { RideHistoryTable } from '@/components/rides/RideHistoryTable';
import { ActiveRideRequest } from '@/components/rides/ActiveRideRequest';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { type CampusLocation } from '@/types/locations';
import { type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Rides() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    if (location.state?.openRideRequest) {
      setIsRequestOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const handleCreateRide = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const pickup = locations.find(loc => loc.id === formData.get('pickup')?.toString());
      const dropoff = locations.find(loc => loc.id === formData.get('dropoff')?.toString());
      
      if (!pickup || !dropoff) {
        toast({
          title: "Error",
          description: "Please select both pickup and dropoff locations",
          variant: "destructive",
        });
        return;
      }

      if (!pickup.coordinates || !dropoff.coordinates) {
        toast({
          title: "Error",
          description: "Invalid location coordinates",
          variant: "destructive",
        });
        return;
      }

      await createRideRequest({
        pickup,
        dropoff,
        notes: formData.get('notes')?.toString(),
        specialRequirements: formData.get('specialRequirements')?.toString(),
      });
      
      setIsRequestOpen(false);
      
      toast({
        title: "Success",
        description: "Ride request created successfully",
      });
    } catch (error) {
      console.error('Error creating ride:', error);
      toast({
        title: "Error",
        description: "Failed to create ride request. Please try again.",
        variant: "destructive",
      });
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
