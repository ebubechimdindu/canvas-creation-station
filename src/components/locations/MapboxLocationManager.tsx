import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type CampusLocation } from '@/types/locations';
import { MapPin, Search, Layers } from 'lucide-react';
import { useState } from 'react';

// Define campus landmarks
const CAMPUS_LANDMARKS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        title: 'Main Gate',
        description: 'University Main Entrance',
        category: 'entry_point'
      },
      geometry: {
        type: 'Point',
        coordinates: [3.7187, 6.894]
      }
    },
    {
      type: 'Feature',
      properties: {
        title: 'Student Center',
        description: 'Main student gathering area',
        category: 'common_area'
      },
      geometry: {
        type: 'Point',
        coordinates: [3.7183, 6.8935]
      }
    },
    {
      type: 'Feature',
      properties: {
        title: 'Academic Building',
        description: 'Main lecture halls',
        category: 'academic'
      },
      geometry: {
        type: 'Point',
        coordinates: [3.7175, 6.8945]
      }
    },
    {
      type: 'Feature',
      properties: {
        title: 'Male Hostel',
        description: 'Male student residence',
        category: 'residence'
      },
      geometry: {
        type: 'Point',
        coordinates: [3.7195, 6.8925]
      }
    },
    {
      type: 'Feature',
      properties: {
        title: 'Female Hostel',
        description: 'Female student residence',
        category: 'residence'
      },
      geometry: {
        type: 'Point',
        coordinates: [3.7165, 6.8925]
      }
    }
  ]
};

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
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    // Initialize map with campus boundaries
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}-v12`,
      center: [3.7187, 6.894], // Babcock University center
      zoom: 16,
      minZoom: 15, // Prevent zooming out too far
      maxZoom: 19, // Allow detailed zoom
      maxBounds: [ // Restrict map panning
        [3.7137, 6.8880], // Southwest coordinates
        [3.7237, 6.8980]  // Northeast coordinates
      ],
      pitchWithRotate: true,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    // Add campus boundary and landmarks after map loads
    map.current.on('load', () => {
      if (!map.current) return;

      // Add campus boundary polygon
      map.current.addSource('campus-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [3.7137, 6.8880],
              [3.7237, 6.8880],
              [3.7237, 6.8980],
              [3.7137, 6.8980],
              [3.7137, 6.8880]
            ]]
          }
        }
      });

      // Add boundary line
      map.current.addLayer({
        id: 'campus-outline',
        type: 'line',
        source: 'campus-boundary',
        paint: {
          'line-color': '#FF0000',
          'line-width': 2
        }
      });

      // Add landmarks
      map.current.addSource('landmarks', {
        type: 'geojson',
        data: CAMPUS_LANDMARKS
      });

      // Add landmark markers
      map.current.addLayer({
        id: 'landmarks',
        type: 'symbol',
        source: 'landmarks',
        layout: {
          'icon-image': 'marker-15',
          'icon-size': 1.5,
          'text-field': ['get', 'title'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': 12
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Add popup for landmarks
      map.current.on('click', 'landmarks', (e) => {
        if (!e.features?.[0]) return;
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { title, description } = e.features[0].properties;
        
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<h3>${title}</h3><p>${description}</p>`)
          .addTo(map.current!);
      });

      // Change cursor on landmark hover
      map.current.on('mouseenter', 'landmarks', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'landmarks', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    if (initialView && showRoutePath) {
      drawRoute(initialView.pickup, initialView.dropoff);
    }

    if (mode === 'driver' && nearbyDrivers) {
      nearbyDrivers.forEach(driver => {
        new mapboxgl.Marker({ color: '#00FF00' })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
      });
    }

    map.current.on('click', (e) => {
      // Only allow clicks within campus bounds
      const { lng, lat } = e.lngLat;
      if (
        lng < 3.7137 || lng > 3.7237 ||
        lat < 6.8880 || lat > 6.8980
      ) {
        toast({
          title: 'Outside Campus',
          description: 'Please select a location within campus boundaries',
          variant: 'destructive'
        });
        return;
      }
      
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
    };
  }, [mapStyle, mapboxToken, initialView, showRoutePath, mode, nearbyDrivers]);

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

        // Fit map to route bounds
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50
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
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=3.7187,6.894&bbox=3.7137,6.8880,3.7237,6.8980&access_token=${mapboxToken}`
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

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${mapStyle}-v12`);
  }, [mapStyle]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const query = `${searchQuery} Babcock University, Ilishan-Remo, Ogun State, Nigeria`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=3.7187,6.894&bbox=3.7137,6.8880,3.7237,6.8980&access_token=${mapboxToken}`
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
