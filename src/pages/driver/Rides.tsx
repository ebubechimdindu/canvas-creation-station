
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

  // Initialize driver location tracking
  useDriverLocation();

  // Set driver's initial location
  useEffect(() => {
    setCurrentLocation({
      lat: 6.894000,
      lng: 3.718700
    });
  }, []);

  // Subscribe to new ride requests
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

      const { error } = await supabase.rpc('handle_driver_response', {
        request_id: requestId,
        driver_id: user.id,
        accepted: true
      });

      if (error) throw error;

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

      const { error } = await supabase.rpc('handle_driver_response', {
        request_id: requestId,
        driver_id: user.id,
        accepted: false
      });

      if (error) throw error;

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

  // Convert ride locations to CampusLocation type
  const getRideLocations = (ride: ExtendedRideRequest | null): { pickup?: CampusLocation; dropoff?: CampusLocation } => {
    if (!ride) return {};

    return {
      pickup: {
        id: `pickup-${ride.id}`,
        name: ride.pickup_address,
        coordinates: {
          lat: parseFloat(ride.pickup_location.split(',')[0]),
          lng: parseFloat(ride.pickup_location.split(',')[1])
        },
        locationType: 'pickup_point',
        isActive: true,
        isVerified: true,
        createdAt: ride.created_at,
        updatedAt: ride.updated_at
      },
      dropoff: {
        id: `dropoff-${ride.id}`,
        name: ride.dropoff_address,
        coordinates: {
          lat: parseFloat(ride.dropoff_location.split(',')[0]),
          lng: parseFloat(ride.dropoff_location.split(',')[1])
        },
        locationType: 'dropoff_point',
        isActive: true,
        isVerified: true,
        createdAt: ride.created_at,
        updatedAt: ride.updated_at
      }
    };
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
                        selectedLocations={getRideLocations(activeRide)}
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
