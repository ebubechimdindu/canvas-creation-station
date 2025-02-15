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

const CAMPUS_LANDMARKS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        title: 'Main Gate',
        description: 'University Main Entrance',
        category: 'entry_point'
      },
      geometry: {
        type: "Point",
        coordinates: [3.7187, 6.894]
      }
    },
    {
      type: "Feature",
      properties: {
        title: 'Student Center',
        description: 'Main student gathering area',
        category: 'common_area'
      },
      geometry: {
        type: "Point",
        coordinates: [3.7185, 6.8942]
      }
    },
    {
      type: "Feature",
      properties: {
        title: 'Academic Building',
        description: 'Main lecture halls',
        category: 'academic'
      },
      geometry: {
        type: "Point",
        coordinates: [3.7183, 6.8938]
      }
    },
    {
      type: "Feature",
      properties: {
        title: 'Male Hostel',
        description: 'Male student residence',
        category: 'residence'
      },
      geometry: {
        type: "Point",
        coordinates: [3.7190, 6.8935]
      }
    },
    {
      type: "Feature",
      properties: {
        title: 'Female Hostel',
        description: 'Female student residence',
        category: 'residence'
      },
      geometry: {
        type: "Point",
        coordinates: [3.7182, 6.8937]
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

const DEFAULT_CENTER: [number, number] = [3.7187, 6.894];
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [3.7167, 6.892], // SW - slightly wider
  [3.7207, 6.896]  // NE - slightly wider
];

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
  const [mapError, setMapError] = useState<string | null>(null);

  const getMapStyle = (style: 'streets' | 'satellite') => {
    return style === 'streets' 
      ? 'mapbox://styles/mapbox/streets-v11'
      : 'mapbox://styles/mapbox/satellite-v9';
  };

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) {
      if (!mapboxToken) {
        setMapError('Missing Mapbox access token');
        toast({
          title: 'Error',
          description: 'Missing Mapbox access token',
          variant: 'destructive'
        });
      }
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyle(mapStyle),
        center: DEFAULT_CENTER,
        zoom: 16,
        minZoom: 15,
        maxZoom: 19,
        maxBounds: DEFAULT_BOUNDS,
        pitchWithRotate: true,
        pitch: 45,
        bearing: -15, // Slight rotation for better campus orientation
        attributionControl: false,
        failIfMajorPerformanceCaveat: true,
        preserveDrawingBuffer: true,
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Source' || resourceType === 'Tile') {
            return {
              url: url,
              headers: {
                'Cache-Control': 'max-age=600' // 10 minutes cache
              }
            };
          }
        }
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
      map.current.addControl(new mapboxgl.AttributionControl({
        compact: true
      }), 'bottom-left');

      map.current.on('style.load', () => {
        if (!map.current) return;

        try {
          // Add campus boundary
          map.current.addSource('campus-boundary', {
            type: 'geojson',
            data: {
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Polygon",
                  coordinates: [[
                    DEFAULT_BOUNDS[0], // SW
                    [DEFAULT_BOUNDS[1][0], DEFAULT_BOUNDS[0][1]], // SE
                    DEFAULT_BOUNDS[1], // NE
                    [DEFAULT_BOUNDS[0][0], DEFAULT_BOUNDS[1][1]], // NW
                    DEFAULT_BOUNDS[0]  // Back to SW to close polygon
                  ]]
                }
              }]
            } as GeoJSON.FeatureCollection
          });

          map.current.addLayer({
            id: 'campus-outline',
            type: 'line',
            source: 'campus-boundary',
            paint: {
              'line-color': '#FF0000',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });

          map.current.addSource('landmarks', {
            type: 'geojson',
            data: CAMPUS_LANDMARKS
          });

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

          // Add event listeners for landmarks
          map.current.on('click', 'landmarks', (e) => {
            if (!e.features?.[0]) return;
            
            const feature = e.features[0];
            const geometry = feature.geometry as GeoJSON.Point;
            const coordinates: [number, number] = [
              geometry.coordinates[0],
              geometry.coordinates[1]
            ];
            
            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`<h3>${feature.properties?.title}</h3><p>${feature.properties?.description}</p>`)
              .addTo(map.current!);
          });

          map.current.on('mouseenter', 'landmarks', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'landmarks', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });

          setMapError(null);
        } catch (error) {
          console.error('Error loading map layers:', error);
          setMapError('Error loading map layers');
          toast({
            title: 'Error',
            description: 'Failed to load map layers',
            variant: 'destructive'
          });
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map loading error');
        toast({
          title: 'Map Error',
          description: 'An error occurred while loading the map',
          variant: 'destructive'
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Map initialization error');
      toast({
        title: 'Error',
        description: 'Failed to initialize map',
        variant: 'destructive'
      });
    }

    if (initialView && showRoutePath) {
      drawRoute(initialView.pickup, initialView.dropoff);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapStyle, mapboxToken, initialView, showRoutePath, mode, nearbyDrivers]);

  const geocode = async (location: string): Promise<[number, number] | null> => {
    if (!mapboxToken) return null;

    try {
      const query = `${location} Babcock University, Ilishan-Remo, Ogun State, Nigeria`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${DEFAULT_CENTER.join(',')}&bbox=${DEFAULT_BOUNDS[0].join(',')},${DEFAULT_BOUNDS[1].join(',')}&access_token=${mapboxToken}&limit=1&types=poi,place,address&language=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.features?.[0]?.center) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      toast({
        title: 'Error',
        description: 'Failed to find location',
        variant: 'destructive'
      });
      return null;
    }
  };

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const query = `${searchQuery} Babcock University, Ilishan-Remo, Ogun State, Nigeria`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${DEFAULT_CENTER.join(',')}&bbox=${DEFAULT_BOUNDS[0].join(',')},${DEFAULT_BOUNDS[1].join(',')}&access_token=${mapboxToken}&limit=1&types=poi,place,address&language=en`
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
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-destructive">{mapError}</p>
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-full" />
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Click on the map to select a location or use the search bar to find specific campus buildings.
        </p>
      </CardContent>
    </Card>
  );
};

export default MapboxLocationManager;
