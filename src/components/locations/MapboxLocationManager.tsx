
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type CampusLocation } from '@/types/locations';
import { MapPin, Search, Layers } from 'lucide-react';

interface MapboxLocationManagerProps {
  onLocationSelect?: (location: CampusLocation) => void;
  onCoordinatesSelect?: (lat: number, lng: number) => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
  className?: string;
  initialView?: {
    pickup: string;
    dropoff: string;
  };
  showRoutePath?: boolean;
  mode?: 'student' | 'driver';
  nearbyDrivers?: Array<{ lat: number; lng: number }>;
  showNearbyRequests?: boolean;
}

const MapboxLocationManager = ({
  onLocationSelect,
  onCoordinatesSelect,
  onRouteCalculated,
  className = "",
  initialView,
  showRoutePath,
  mode,
  nearbyDrivers,
  showNearbyRequests
}: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const { toast } = useToast();
  const selectedMarker = useRef<mapboxgl.Marker | null>(null);
  const driversMarkers = useRef<mapboxgl.Marker[]>([]);
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Campus boundaries
  const CAMPUS_CENTER = [3.7242, 6.8923] as [number, number];
  const CAMPUS_BOUNDS = [
    [3.7192, 6.8873], // Southwest coordinates
    [3.7292, 6.8973]  // Northeast coordinates
  ] as [[number, number], [number, number]];

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}-v12`,
      center: CAMPUS_CENTER,
      zoom: 16,
      minZoom: 15,
      maxZoom: 19,
      pitchWithRotate: true,
      pitch: 45,
      maxBounds: CAMPUS_BOUNDS
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      if (selectedMarker.current) {
        selectedMarker.current.remove();
      }

      selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      onCoordinatesSelect?.(lat, lng);

      toast({
        title: 'Location Selected',
        description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Handle map style changes
  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${mapStyle}-v12`);
  }, [mapStyle]);

  // Handle route drawing
  useEffect(() => {
    if (!map.current || !initialView || !showRoutePath) return;
    drawRoute(initialView.pickup, initialView.dropoff);
  }, [initialView, showRoutePath, mapboxToken]);

  // Handle nearby drivers updates
  useEffect(() => {
    if (!map.current || !nearbyDrivers) return;

    // Clear existing driver markers
    driversMarkers.current.forEach(marker => marker.remove());
    driversMarkers.current = [];

    // Add new driver markers
    nearbyDrivers.forEach(driver => {
      const marker = new mapboxgl.Marker({ color: '#00FF00' })
        .setLngLat([driver.lng, driver.lat])
        .addTo(map.current!);
      driversMarkers.current.push(marker);
    });

    return () => {
      driversMarkers.current.forEach(marker => marker.remove());
      driversMarkers.current = [];
    };
  }, [nearbyDrivers]);

  const drawRoute = async (pickup: string, dropoff: string) => {
    if (!map.current || !mapboxToken) return;

    try {
      const pickupCoords = await geocode(pickup);
      const dropoffCoords = await geocode(dropoff);

      if (!pickupCoords || !dropoffCoords) {
        toast({
          title: 'Error',
          description: 'Could not find locations',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords.join(',')};${dropoffCoords.join(',')}?geometries=geojson&access_token=${mapboxToken}`
      );

      const data = await response.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Convert to kilometers
        const duration = route.duration / 60; // Convert to minutes

        onRouteCalculated?.(distance, duration);

        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
        } else {
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              }
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.75
            }
          });
        }

        // Fit map to route bounds within campus bounds
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 19
        });
      }
    } catch (error) {
      console.error('Error drawing route:', error);
      toast({
        title: 'Error',
        description: 'Could not draw route',
        variant: 'destructive'
      });
    }
  };

  const geocode = async (location: string): Promise<[number, number] | null> => {
    if (!mapboxToken) return null;

    try {
      const query = `${location} Babcock University, Ilishan-Remo, Ogun State, Nigeria`;
      const bbox = CAMPUS_BOUNDS.flat().join(','); // Convert bounds to bbox string
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${CAMPUS_CENTER.join(',')}&bbox=${bbox}&types=poi,address&access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.features?.[0]?.center) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const query = `${searchQuery} Babcock University, Ilishan-Remo, Ogun State, Nigeria`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=3.7163,6.8906&access_token=${mapboxToken}`
      );

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        const [lng, lat] = location.center;

        if (selectedMarker.current) {
          selectedMarker.current.remove();
        }

        selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        map.current?.flyTo({
          center: [lng, lat],
          zoom: 18,
          duration: 2000,
          essential: true
        });

        onCoordinatesSelect?.(lat, lng);

        toast({
          title: 'Location Found',
          description: location.place_name,
        });
      } else {
        toast({
          title: 'No Results',
          description: 'No locations found matching your search',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search for location',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Campus Location Manager</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
            setMapStyle(newStyle);
          }}
          className="ml-2"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search">Search Location</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search for a campus location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        <p className="text-sm text-muted-foreground">
          Click on the map to select a location or use the search bar to find specific campus buildings.
        </p>
      </CardContent>
    </Card>
  );
};

export default MapboxLocationManager;
