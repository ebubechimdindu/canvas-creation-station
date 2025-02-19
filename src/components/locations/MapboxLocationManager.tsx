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
import { useMap } from '@/components/map/MapProvider';
import { useCampusLocations } from '@/hooks/use-campus-locations';

const CAMPUS_LANDMARKS: Record<string, [number, number]> = {
  'Main Gate': [3.7242, 6.8923],
  'Library': [3.7250, 6.8930],
  'Cafeteria': [3.7245, 6.8925],
  'Sports Complex': [3.7240, 6.8920],
  'Administrative Block': [3.7248, 6.8928]
};

interface MarkerState {
  pickup: mapboxgl.Marker | null;
  dropoff: mapboxgl.Marker | null;
  activeType: 'pickup' | 'dropoff';
}

interface MapboxLocationManagerProps {
  onLocationSelect?: (location: CampusLocation, type: 'pickup' | 'dropoff') => void;
  onCoordinatesSelect?: (lat: number, lng: number, type: 'pickup' | 'dropoff') => void;
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
  selectedLocations?: {
    pickup?: CampusLocation;
    dropoff?: CampusLocation;
  };
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
  showNearbyRequests,
  selectedLocations
}: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const { toast } = useToast();
  const markerRefs = useRef<MarkerState>({
    pickup: null,
    dropoff: null,
    activeType: 'pickup'
  });
  const driversMarkers = useRef<mapboxgl.Marker[]>([]);
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const { mapboxToken } = useMap();
  const { locations } = useCampusLocations();
  const locationMarkers = useRef<mapboxgl.Marker[]>([]);

  const CAMPUS_CENTER = [3.7242, 6.8923] as [number, number];
  const CAMPUS_BOUNDS = [
    [3.7192, 6.8873], // Southwest coordinates
    [3.7292, 6.8973]  // Northeast coordinates
  ] as [[number, number], [number, number]];

  const MARKER_COLORS = {
    pickup: '#3B82F6', // Blue
    dropoff: '#EF4444'  // Red
  };

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

    if (mode === 'student') {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        const currentType = markerRefs.current.activeType;
        
        if (markerRefs.current[currentType]) {
          markerRefs.current[currentType]?.setLngLat([lng, lat]);
        } else {
          markerRefs.current[currentType] = new mapboxgl.Marker({ 
            color: MARKER_COLORS[currentType],
            draggable: true
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          markerRefs.current[currentType]?.on('dragend', () => {
            const marker = markerRefs.current[currentType];
            if (marker) {
              const { lng: newLng, lat: newLat } = marker.getLngLat();
              onCoordinatesSelect?.(newLat, newLng, currentType);
              toast({
                title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Location Updated`,
                description: `New coordinates: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`,
              });
            }
          });
        }

        onCoordinatesSelect?.(lat, lng, currentType);

        toast({
          title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Location Selected`,
          description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
        });

        markerRefs.current.activeType = currentType === 'pickup' ? 'dropoff' : 'pickup';
      });
    }

    const resizeMap = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', resizeMap);
    resizeMap();

    return () => {
      window.removeEventListener('resize', resizeMap);
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, mode]);

  useEffect(() => {
    if (!map.current || !selectedLocations) return;

    const updateMarker = (type: 'pickup' | 'dropoff', location?: CampusLocation) => {
      if (!location) return;

      const { lat, lng } = location.coordinates;
      
      if (markerRefs.current[type]) {
        markerRefs.current[type]?.setLngLat([lng, lat]);
      } else {
        markerRefs.current[type] = new mapboxgl.Marker({ 
          color: MARKER_COLORS[type],
          draggable: true
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    };

    if (selectedLocations.pickup) {
      updateMarker('pickup', selectedLocations.pickup);
    }
    if (selectedLocations.dropoff) {
      updateMarker('dropoff', selectedLocations.dropoff);
    }
  }, [selectedLocations]);

  useEffect(() => {
    if (!map.current || !initialView || !showRoutePath) return;
    drawRoute(initialView.pickup, initialView.dropoff);
  }, [initialView, showRoutePath, mapboxToken]);

  useEffect(() => {
    if (!map.current || !nearbyDrivers) return;

    driversMarkers.current.forEach(marker => marker.remove());
    driversMarkers.current = [];

    nearbyDrivers.forEach(driver => {
      const marker = new mapboxgl.Marker({ color: '#00FF00' })
        .setLngLat([driver.lng, driver.lat])
        .addTo(map.current!);
      driversMarkers.current.push(marker);
    });

    if (mode === 'driver' && nearbyDrivers.length > 0) {
      map.current.flyTo({
        center: [nearbyDrivers[0].lng, nearbyDrivers[0].lat],
        zoom: 17,
        essential: true
      });
    }

    return () => {
      driversMarkers.current.forEach(marker => marker.remove());
      driversMarkers.current = [];
    };
  }, [nearbyDrivers, mode]);

  useEffect(() => {
    if (!map.current || !locations.length) return;

    locationMarkers.current.forEach(marker => marker.remove());
    locationMarkers.current = [];

    locations.forEach(location => {
      if (!isValidCoordinate(location.coordinates.lng, location.coordinates.lat)) {
        console.warn(`Invalid coordinates for location ${location.name}`);
        return;
      }

      const marker = new mapboxgl.Marker({ 
        color: getMarkerColor(location.locationType),
        scale: 0.8
      })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <div class="font-medium">${location.name}</div>
            ${location.buildingCode ? `<div class="text-sm text-gray-500">${location.buildingCode}</div>` : ''}
            ${location.description ? `<div class="text-sm mt-1">${location.description}</div>` : ''}
          </div>
        `))
        .addTo(map.current!);

      locationMarkers.current.push(marker);
    });

    const validLocations = locations.filter(loc => 
      isValidCoordinate(loc.coordinates.lng, loc.coordinates.lat)
    );

    if (validLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validLocations.forEach(location => {
        bounds.extend([location.coordinates.lng, location.coordinates.lat]);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 19
      });
    }

    return () => {
      locationMarkers.current.forEach(marker => marker.remove());
      locationMarkers.current = [];
    };
  }, [locations, map.current]);

  const getMarkerColor = (locationType: string) => {
    switch (locationType) {
      case 'academic':
        return '#3B82F6'; // blue
      case 'residence':
        return '#10B981'; // green
      case 'common_area':
        return '#F59E0B'; // yellow
      case 'administrative':
        return '#6366F1'; // indigo
      case 'pickup_point':
        return '#EC4899'; // pink
      case 'dropoff_point':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  };

  const drawRoute = async (pickup: string, dropoff: string) => {
    if (!map.current || !mapboxToken || !selectedLocations?.pickup || !selectedLocations?.dropoff) return;

    try {
      const pickupCoords = [selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat];
      const dropoffCoords = [selectedLocations.dropoff.coordinates.lng, selectedLocations.dropoff.coordinates.lat];

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
          padding: 50,
          maxZoom: 19
        });
      }
    } catch (error) {
      console.error('Error drawing route:', error);
      toast({
        title: 'Error',
        description: 'Could not draw route between selected locations',
        variant: 'destructive'
      });
    }
  };

  const geocode = async (location: string): Promise<[number, number] | null> => {
    if (!mapboxToken) return null;

    const landmarkEntry = Object.entries(CAMPUS_LANDMARKS).find(([name]) => 
      name.toLowerCase().includes(location.toLowerCase())
    );
    if (landmarkEntry) {
      return landmarkEntry[1];
    }

    try {
      const query = location;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${CAMPUS_CENTER.join(',')}&types=poi,address,place&language=en&access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.features?.[0]?.center) {
        const [lng, lat] = data.features[0].center;
        if (lng >= CAMPUS_BOUNDS[0][0] && lng <= CAMPUS_BOUNDS[1][0] &&
            lat >= CAMPUS_BOUNDS[0][1] && lat <= CAMPUS_BOUNDS[1][1]) {
          return [lng, lat];
        }
      }
      
      toast({
        title: 'Location Outside Campus',
        description: 'Please select a location within Babcock University campus',
        variant: 'destructive'
      });
      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const coordinates = await geocode(searchQuery);
      
      if (coordinates) {
        const [lng, lat] = coordinates;
        const currentType = markerRefs.current.activeType;

        if (markerRefs.current[currentType]) {
          markerRefs.current[currentType]?.setLngLat([lng, lat]);
        } else {
          markerRefs.current[currentType] = new mapboxgl.Marker({ 
            color: MARKER_COLORS[currentType],
            draggable: true 
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }

        map.current?.flyTo({
          center: [lng, lat],
          zoom: 18,
          duration: 2000,
          essential: true
        });

        onCoordinatesSelect?.(lat, lng, currentType);

        toast({
          title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Location Found`,
          description: `Selected: ${searchQuery}`,
        });

        markerRefs.current.activeType = currentType === 'pickup' ? 'dropoff' : 'pickup';
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search for location',
        variant: 'destructive'
      });
    }
  };

  const isValidCoordinate = (lng: number, lat: number) => {
    return !isNaN(lng) && 
           !isNaN(lat) && 
           lng >= -180 && 
           lng <= 180 && 
           lat >= -90 && 
           lat <= 90;
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Campus Location Manager</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Pickup</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Dropoff</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
              setMapStyle(newStyle);
            }}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="relative w-full h-[600px]">
          <div ref={mapContainer} className="absolute inset-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default MapboxLocationManager;
