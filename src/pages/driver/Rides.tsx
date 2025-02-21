import React, { useEffect, useState } from 'react';
import DriverSidebar from '@/components/driver/DriverSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  useDriverLocation();

  useEffect(() => {
    setCurrentLocation({
      lat: 6.894000,
      lng: 3.718700
    });
  }, []);

  useEffect(() => {
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

    fetchPendingRequests();

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

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status: 'driver_assigned',
          driver_id: user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const acceptedRequest = pendingRequests.find(req => req.id === requestId);
      if (acceptedRequest) {
        setActiveRide(acceptedRequest);
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      }

      toast({
        title: 'Success',
        description: 'Ride request accepted'
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept request',
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
          status: 'finding_driver'
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

  const getSelectedLocations = () => {
    let locations: { pickup?: CampusLocation; dropoff?: CampusLocation } = {};

    if (activeRide) {
      const [pickupLat, pickupLng] = activeRide.pickup_location.split(',').map(parseFloat);
      const [dropoffLat, dropoffLng] = activeRide.dropoff_location.split(',').map(parseFloat);

      locations = {
        pickup: {
          id: 'active-pickup',
          name: `${activeRide.student_profiles?.full_name}'s Pickup: ${activeRide.pickup_address}`,
          coordinates: { lat: pickupLat, lng: pickupLng },
          locationType: 'pickup_point',
          isActive: true,
          isVerified: true,
          createdAt: activeRide.created_at,
          updatedAt: activeRide.updated_at
        },
        dropoff: {
          id: 'active-dropoff',
          name: `${activeRide.student_profiles?.full_name}'s Dropoff: ${activeRide.dropoff_address}`,
          coordinates: { lat: dropoffLat, lng: dropoffLng },
          locationType: 'dropoff_point',
          isActive: true,
          isVerified: true,
          createdAt: activeRide.created_at,
          updatedAt: activeRide.updated_at
        }
      };
    } 
    else if (pendingRequests.length > 0) {
      const request = pendingRequests[0];
      const [lat, lng] = request.pickup_location.split(',').map(parseFloat);
      
      locations = {
        pickup: {
          id: `pickup-${request.id}`,
          name: `${request.student_profiles?.full_name}'s Pickup: ${request.pickup_address}`,
          coordinates: { lat, lng },
          locationType: 'pickup_point',
          isActive: true,
          isVerified: true,
          createdAt: request.created_at,
          updatedAt: request.updated_at
        }
      };
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
                          onAccept={() => {}}
                          onDecline={() => {}}
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
