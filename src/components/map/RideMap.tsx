import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Driver } from '@/types';
import { Card } from '../ui/card';
import { Loader2, Sun, Moon } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

// UI Lagos center coordinates
const defaultCenter = {
  lat: 6.4552,
  lng: 3.4470
};

interface RideMapProps {
  pickup: string;
  dropoff: string;
  className?: string;
  showRoutePath?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
  mode?: 'student' | 'driver';
  driverLocation?: Driver['currentLocation'];
  nearbyDrivers?: Driver[];
  onDriverLocationUpdate?: (lat: number, lng: number) => void;
  showNearbyRequests?: boolean;
}

const RideMap = ({ 
  pickup, 
  dropoff, 
  className = "",
  showRoutePath = true,
  onRouteCalculated,
  mode = 'student',
  driverLocation,
  nearbyDrivers = [],
  onDriverLocationUpdate,
  showNearbyRequests = false
}: RideMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapStyle, setMapStyle] = useState<'default' | 'dark'>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsLoading(false);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!isLoaded || !pickup || !dropoff || !showRoutePath) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          if (onRouteCalculated) {
            const route = result.routes[0];
            if (route.legs.length > 0) {
              const leg = route.legs[0];
              onRouteCalculated(
                leg.distance?.value || 0 / 1000, // Convert to km
                leg.duration?.value || 0 / 60 // Convert to minutes
              );
            }
          }
        }
      }
    );
  }, [isLoaded, pickup, dropoff, showRoutePath, onRouteCalculated]);

  useEffect(() => {
    if (!isLoaded || !map || !driverLocation) return;

    const position = new google.maps.LatLng(driverLocation.lat, driverLocation.lng);

    if (!driverMarker) {
      const marker = new google.maps.Marker({
        position,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4ade80',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });
      setDriverMarker(marker);
    } else {
      driverMarker.setPosition(position);
    }

    map.panTo(position);
  }, [isLoaded, map, driverLocation, driverMarker]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    nearbyDrivers.forEach(driver => {
      if (driver.currentLocation) {
        new google.maps.Marker({
          position: new google.maps.LatLng(
            driver.currentLocation.lat,
            driver.currentLocation.lng
          ),
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: driver.status === 'available' ? '#4ade80' : '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });
      }
    });
  }, [isLoaded, map, nearbyDrivers]);

  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'default' ? 'dark' : 'default';
    setMapStyle(newStyle);
    
    if (map) {
      map.setOptions({
        styles: newStyle === 'dark' ? [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          // ... Add more dark mode styles as needed
        ] : []
      });
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <Card className={`relative ${className} min-h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation || defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyle === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            // ... Add more dark mode styles as needed
          ] : [],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
        }}
        onClick={(e) => {
          if (mode === 'driver' && onDriverLocationUpdate && e.latLng) {
            onDriverLocationUpdate(e.latLng.lng(), e.latLng.lat());
          }
        }}
      >
        {directions && showRoutePath && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 4,
                strokeOpacity: 0.75,
              }
            }}
          />
        )}
      </GoogleMap>
      
      <div className="absolute top-4 left-4 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={toggleMapStyle}
        >
          {mapStyle === 'default' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default RideMap;
