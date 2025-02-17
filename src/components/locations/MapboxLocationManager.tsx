import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type CampusLocation, type LocationReference } from '@/types/locations';
import { MapPin, Search, Layers } from 'lucide-react';
import { useMap } from '@/components/map/MapProvider';
import { useCampusLocations } from '@/hooks/use-campus-locations';
import { useLocationReferences } from '@/hooks/use-location-references';
import { LocationInfoCard } from '@/components/locations/LocationInfoCard';

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
  const isMapLoaded = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const { getNearbyReferences, formatLocationDescription } = useLocationReferences();
  const [activeReferences, setActiveReferences] = useState<LocationReference[]>([]);

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

    map.current.on('load', () => {
      isMapLoaded.current = true;
      
      // Initialize route layer
      if (map.current && showRoutePath) {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
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
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    // Initialize audio context on user interaction
    const initAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
        notificationSound.current = new Audio('/notification.mp3');
      }
    };

    document.addEventListener('click', initAudio, { once: true });

    if (mode === 'student') {
      map.current.on('click', (e) => {
        handleMapClick(e);
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
      document.removeEventListener('click', initAudio);
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
    if (!map.current || !mapboxToken) return;

    try {
      if (!isMapLoaded.current) {
        await new Promise<void>((resolve) => {
          const checkLoaded = () => {
            if (map.current?.isStyleLoaded()) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

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

        const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
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
        description: 'Could not draw route. Please try again.',
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

  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    if (!map.current) return;
    
    const { lng, lat } = e.lngLat;
    const currentType = markerRefs.current.activeType;
    
    // Get nearby references
    const references = await getNearbyReferences(lat, lng);
    setActiveReferences(references);
    
    // Update marker
    if (currentType === 'pickup') {
      if (markerRefs.current.pickup) markerRefs.current.pickup.remove();
      markerRefs.current.pickup = new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      if (markerRefs.current.dropoff) markerRefs.current.dropoff.remove();
      markerRefs.current.dropoff = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Notify parent with location info
    onCoordinatesSelect?.(lat, lng, currentType);
    
    toast({
      title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Location Selected`,
      description: formatLocationDescription(references),
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {activeReferences.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 w-72">
          <LocationInfoCard references={activeReferences} />
        </div>
      )}
    </div>
  );
};

export default MapboxLocationManager;
