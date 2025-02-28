
import React, { useEffect, useState } from 'react';
import DriverSidebar from '@/components/driver/DriverSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDriverLocation } from '@/hooks/use-driver-location';
import { supabase } from '@/lib/supabase';
import { MapProvider } from '@/components/map/MapProvider';
import MapboxLocationManager from '@/components/map/MapboxLocationManager';
import { RideRequestCard } from '@/components/driver/RideRequestCard';
import type { RideRequest } from '@/types';
import type { CampusLocation } from '@/types/locations';
import { SidebarProvider } from '@/components/ui/sidebar';

interface ExtendedRideRequest extends RideRequest {
  student_profiles?: {
    full_name: string;
    phone_number: string;
  }
}

const DriverRides = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ExtendedRideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<ExtendedRideRequest | null>(null);
  const { toast } = useToast();

  // Use the driver location hook
  const { error: locationError } = useDriverLocation();
  
  // Listen for geolocation updates
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'Location Error',
          description: 'Unable to get your current location. Please enable location services.',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [toast]);

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select(`
        *,
        student_profiles:student_id (
          full_name,
          phone_number
        )
      `)
      .in('status', ['requested', 'finding_driver']);

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    setPendingRequests(data || []);
  };

  const fetchActiveRide = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ride_requests')
      .select(`
        *,
        student_profiles:student_id (
          full_name,
          phone_number
        )
      `)
      .eq('driver_id', user.id)
      .in('status', ['driver_assigned', 'en_route_to_pickup', 'arrived_at_pickup', 'in_progress'])
      .limit(1)
      .maybeSingle();

    if (error && !error.message.includes('contains 0 rows')) {
      console.error('Error fetching active ride:', error);
      return;
    }

    setActiveRide(data || null);
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchActiveRide();

    const channel = supabase
      .channel('ride_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests'
        },
        () => {
          fetchPendingRequests();
          fetchActiveRide();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Fetch the current status of the ride first
      const { data: currentRide, error: fetchError } = await supabase
        .from('ride_requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Only proceed if the ride is still in a status that can be accepted
      if (!['requested', 'finding_driver'].includes(currentRide.status)) {
        toast({
          title: 'Ride Unavailable',
          description: 'This ride has already been assigned to another driver.',
          variant: 'destructive'
        });
        return;
      }

      // Update the ride with the driver's ID and change status
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status: 'driver_assigned',
          driver_id: user.id,
          matched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Fetch the updated ride details
      const { data: updatedRide, error: fetchUpdatedError } = await supabase
        .from('ride_requests')
        .select(`
          *,
          student_profiles:student_id (
            full_name,
            phone_number
          )
        `)
        .eq('id', requestId)
        .single();

      if (fetchUpdatedError) throw fetchUpdatedError;

      // Verify the status was updated correctly
      if (updatedRide.status !== 'driver_assigned') {
        console.warn('Ride status was not updated to driver_assigned, current status:', updatedRide.status);
      }

      setActiveRide(updatedRide);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      toast({
        title: 'Success',
        description: 'Ride request accepted'
      });
      
      // Refresh the data immediately to ensure UI is in sync
      fetchPendingRequests();
      fetchActiveRide();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status: 'finding_driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      toast({
        title: 'Success',
        description: 'Ride request declined'
      });
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline request',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'arrived_at_pickup' | 'in_progress' | 'completed') => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', requestId)
        .eq('driver_id', user.id);

      if (updateError) throw updateError;

      if (activeRide?.id === requestId) {
        setActiveRide(prev => prev ? { ...prev, status: newStatus } : null);
      }

      const messages = {
        arrived_at_pickup: 'You have arrived at the pickup location',
        in_progress: 'Ride started',
        completed: 'Ride completed'
      };

      toast({
        title: 'Status Updated',
        description: messages[newStatus]
      });

      if (newStatus === 'completed') {
        setActiveRide(null);
        fetchActiveRide();
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ride status',
        variant: 'destructive'
      });
    }
  };

  const extractCoordinates = (location: string | null | unknown): { lat: number; lng: number } | null => {
    if (!location) return null;
    
    try {
      if (typeof location === 'object' && location !== null) {
        const coords = location as any;
        if ('coordinates' in coords) {
          return {
            lat: coords.coordinates[1],
            lng: coords.coordinates[0]
          };
        }
      }

      if (typeof location === 'string') {
        const pointMatch = location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (pointMatch) {
          return {
            lat: parseFloat(pointMatch[2]),
            lng: parseFloat(pointMatch[1])
          };
        }

        const [lat, lng] = location.split(',').map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }

      console.warn('Could not parse location:', location);
      return null;
    } catch (error) {
      console.error('Error parsing location:', error);
      return null;
    }
  };

  const getSelectedLocations = () => {
    let locations: { pickup?: CampusLocation; dropoff?: CampusLocation } = {};

    if (activeRide) {
      const pickupCoords = extractCoordinates(activeRide.pickup_location);
      const dropoffCoords = extractCoordinates(activeRide.dropoff_location);

      if (pickupCoords && dropoffCoords) {
        locations = {
          pickup: {
            id: 'active-pickup',
            name: `${activeRide.student_profiles?.full_name}'s Pickup: ${activeRide.pickup_address}`,
            coordinates: pickupCoords,
            locationType: 'pickup_point',
            isActive: true,
            isVerified: true,
            createdAt: activeRide.created_at,
            updatedAt: activeRide.updated_at
          },
          dropoff: {
            id: 'active-dropoff',
            name: `${activeRide.student_profiles?.full_name}'s Dropoff: ${activeRide.dropoff_address}`,
            coordinates: dropoffCoords,
            locationType: 'dropoff_point',
            isActive: true,
            isVerified: true,
            createdAt: activeRide.created_at,
            updatedAt: activeRide.updated_at
          }
        };
      }
    } else if (pendingRequests.length > 0) {
      const request = pendingRequests[0];
      const pickupCoords = extractCoordinates(request.pickup_location);
      
      if (pickupCoords) {
        locations = {
          pickup: {
            id: `pickup-${request.id}`,
            name: `${request.student_profiles?.full_name}'s Pickup: ${request.pickup_address}`,
            coordinates: pickupCoords,
            locationType: 'pickup_point',
            isActive: true,
            isVerified: true,
            createdAt: request.created_at,
            updatedAt: request.updated_at
          }
        };
      }
    }

    return locations;
  };

  return (
    <SidebarProvider>
      <MapProvider>
        <div className="flex h-screen bg-background">
          <DriverSidebar />
          
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Ride Requests</h1>
                <Badge variant={currentLocation ? "success" : "destructive"}>
                  {currentLocation ? "Online" : "Offline"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                  <CardContent className="p-0">
                    <div className="h-[400px] w-full">
                      <MapboxLocationManager
                        mode="driver"
                        currentLocation={currentLocation || undefined}
                        selectedLocations={getSelectedLocations()}
                        showRoutePath={!!activeRide}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <RideRequestCard
                          key={request.id}
                          request={{
                            ...request,
                            notes: `Student: ${request.student_profiles?.full_name}\nPhone: ${request.student_profiles?.phone_number}\n${request.notes || ''}`
                          }}
                          onAccept={handleAcceptRequest}
                          onDecline={handleDeclineRequest}
                        />
                      ))}
                      {pendingRequests.length === 0 && (
                        <p className="text-center text-muted-foreground">
                          No pending requests
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Ride</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeRide ? (
                      <div className="space-y-4">
                        <RideRequestCard
                          request={{
                            ...activeRide,
                            notes: `Student: ${activeRide.student_profiles?.full_name}\nPhone: ${activeRide.student_profiles?.phone_number}\n${activeRide.notes || ''}`
                          }}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        No active ride
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </MapProvider>
    </SidebarProvider>
  );
};

export default DriverRides;
