
import React, { useEffect, useState } from 'react';
import { DriverSidebar } from '@/components/driver/DriverSidebar';
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
import { SidebarProvider } from '@/components/ui/sidebar';

const DriverRides = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const { toast } = useToast();

  // Initialize driver location tracking
  useDriverLocation();

  // Get current location
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
          description: 'Failed to get your current location',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [toast]);

  // Subscribe to new ride requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
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
        (payload) => {
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
      const { error } = await supabase.rpc('handle_driver_response', {
        request_id: requestId,
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
      const { error } = await supabase.rpc('handle_driver_response', {
        request_id: requestId,
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
                        selectedLocations={
                          activeRide
                            ? {
                                pickup: {
                                  name: activeRide.pickup_address,
                                  coordinates: {
                                    lat: 6.8923,
                                    lng: 3.7242
                                  }
                                },
                                dropoff: {
                                  name: activeRide.dropoff_address,
                                  coordinates: {
                                    lat: 6.8913,
                                    lng: 3.7252
                                  }
                                }
                              }
                            : undefined
                        }
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
                          request={request}
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
                          request={activeRide}
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
