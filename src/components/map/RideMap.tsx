import React, { useCallback, useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Driver } from '@/types';
import { Card } from '../ui/card';
import { Loader2, Sun, Moon, MapPin } from 'lucide-react';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 6.4552,
  lng: 3.4470
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

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
  onLocationSelect?: (type: 'pickup' | 'dropoff', location: { address: string; lat: number; lng: number }) => void;
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
  showNearbyRequests = false,
  onLocationSelect
}: RideMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapStyle, setMapStyle] = useState<'default' | 'dark'>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<{
    pickup?: google.maps.LatLng;
    dropoff?: google.maps.LatLng;
  }>({});
  
  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const { data, error } = await supabase
          .from('secrets')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_API_KEY')
          .single();

        if (error) {
          console.error('Error loading API key:', error);
          toast.error('Failed to load map configuration.');
          return;
        }

        if (!data?.value) {
          console.error('No API key found in Supabase');
          toast.error('API key not found. Please configure it in Supabase.');
          return;
        }

        setGoogleMapsApiKey(data.value);
        console.log('Successfully loaded Google Maps API key');
      } catch (error) {
        console.error('Failed to load API key:', error);
        toast.error('Failed to load map configuration');
      }
    };

    loadApiKey();
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  });

  // Debug log for loading states
  useEffect(() => {
    console.log('Map Loading Status:', {
      jsApiLoaded: isLoaded,
      internalLoading: isLoading,
      hasError: !!loadError,
      errorDetails: loadError?.message,
      mapInstance: !!map
    });

    if (isLoaded && isLoading) {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, loadError, map]);

  const calculateRoute = useCallback(() => {
    if (!markers.pickup || !markers.dropoff) {
      console.log('Route calculation skipped: Missing markers', { pickup: !!markers.pickup, dropoff: !!markers.dropoff });
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    console.log('Calculating route between:', {
      origin: markers.pickup.toJSON(),
      destination: markers.dropoff.toJSON()
    });

    directionsService.route(
      {
        origin: markers.pickup.toJSON(),
        destination: markers.dropoff.toJSON(),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.log('Route calculation result:', { status, hasResult: !!result });
        
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          if (onRouteCalculated && result.routes[0]?.legs[0]) {
            const { distance, duration } = result.routes[0].legs[0];
            onRouteCalculated(
              distance?.value ? distance.value / 1000 : 0,
              duration?.value ? duration.value / 60 : 0
            );
          }
        } else {
          console.error('Route calculation failed:', status);
          toast.error('Failed to calculate route. Please try again.');
        }
      }
    );
  }, [markers, onRouteCalculated]);

  useEffect(() => {
    if (markers.pickup && markers.dropoff) {
      calculateRoute();
    }
  }, [markers, calculateRoute]);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded successfully');
    setMap(map);
    setIsLoading(false);
  }, []);

  const onUnmount = useCallback(() => {
    console.log('Map unmounted');
    setMap(null);
  }, []);

  const handlePlaceSelect = useCallback((type: 'pickup' | 'dropoff') => {
    const autocomplete = type === 'pickup' ? pickupAutocomplete.current : dropoffAutocomplete.current;
    const place = autocomplete?.getPlace();
    
    console.log(`Place selected for ${type}:`, {
      hasPlace: !!place,
      hasGeometry: !!place?.geometry,
      address: place?.formatted_address
    });

    if (place?.geometry?.location) {
      const location = new google.maps.LatLng(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
      
      setMarkers(prev => ({
        ...prev,
        [type]: location
      }));

      if (onLocationSelect) {
        onLocationSelect(type, {
          address: place.formatted_address || '',
          lat: location.lat(),
          lng: location.lng()
        });
      }

      if (map) {
        map.panTo(location);
        map.setZoom(15);
      }
    } else {
      console.error('Selected place has no geometry');
      toast.error('Invalid location selected. Please try again.');
    }
  }, [map, onLocationSelect]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) {
      console.error('Map click event has no coordinates');
      return;
    }

    console.log('Map clicked:', e.latLng.toJSON());

    if (mode === 'driver' && onDriverLocationUpdate) {
      onDriverLocationUpdate(e.latLng.lat(), e.latLng.lng());
      return;
    }

    // For student mode, allow clicking to set locations
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: e.latLng }, (results, status) => {
      console.log('Geocoding result:', { status, hasResults: !!results?.length });

      if (status === 'OK' && results?.[0]) {
        const address = results[0].formatted_address;
        const locationType = !markers.pickup ? 'pickup' : !markers.dropoff ? 'dropoff' : null;

        if (locationType && onLocationSelect) {
          onLocationSelect(locationType, {
            address,
            lat: e.latLng!.lat(),
            lng: e.latLng!.lng()
          });

          setMarkers(prev => ({
            ...prev,
            [locationType]: e.latLng!
          }));
        }
      } else {
        console.error('Geocoding failed:', status);
        toast.error('Failed to get address for selected location. Please try again.');
      }
    });
  }, [mode, onDriverLocationUpdate, markers, onLocationSelect]);

  if (loadError) {
    console.error('Map loading error:', loadError);
    return (
      <Card className={`${className} min-h-[300px] flex items-center justify-center`}>
        <div className="text-center space-y-2">
          <p className="text-red-500">Error loading map</p>
          <p className="text-sm text-muted-foreground">{loadError.message}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

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
    <div className={`relative ${className}`}>
      {mode === 'student' && (
        <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup-location">Pickup Location</Label>
              <Autocomplete
                onLoad={auto => pickupAutocomplete.current = auto}
                onPlaceChanged={() => handlePlaceSelect('pickup')}
              >
                <Input
                  id="pickup-location"
                  placeholder="Enter pickup location"
                  className="w-full"
                />
              </Autocomplete>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoff-location">Dropoff Location</Label>
              <Autocomplete
                onLoad={auto => dropoffAutocomplete.current = auto}
                onPlaceChanged={() => handlePlaceSelect('dropoff')}
              >
                <Input
                  id="dropoff-location"
                  placeholder="Enter dropoff location"
                  className="w-full"
                />
              </Autocomplete>
            </div>
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation || markers.pickup || defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          styles: mapStyle === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          ] : [],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {markers.pickup && (
          <Marker
            position={markers.pickup}
            icon={{
              url: '/pickup-marker.svg',
              scaledSize: new google.maps.Size(40, 40)
            }}
          />
        )}

        {markers.dropoff && (
          <Marker
            position={markers.dropoff}
            icon={{
              url: '/dropoff-marker.svg',
              scaledSize: new google.maps.Size(40, 40)
            }}
          />
        )}

        {driverLocation && (
          <Marker
            position={driverLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4ade80',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}

        {nearbyDrivers.map((driver, index) => (
          driver.currentLocation && (
            <Marker
              key={driver.id || index}
              position={driver.currentLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: driver.status === 'available' ? '#4ade80' : '#ef4444',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
          )
        ))}

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

      <div className="absolute top-4 right-4 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={() => setMapStyle(prev => prev === 'default' ? 'dark' : 'default')}
        >
          {mapStyle === 'default' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default RideMap;
