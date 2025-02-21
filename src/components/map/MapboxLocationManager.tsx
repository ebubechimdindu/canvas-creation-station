
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from '@/components/map/MapProvider';
import type { CampusLocation } from '@/types/locations';

interface MapboxLocationManagerProps {
  selectedLocations?: {
    pickup?: CampusLocation;
    dropoff?: CampusLocation;
  };
  showRoutePath?: boolean;
  mode?: 'student' | 'driver';
  nearbyDrivers?: Array<{ lat: number; lng: number }>;
  currentLocation?: { lat: number; lng: number };
}

const MapboxLocationManager = ({
  selectedLocations,
  showRoutePath = false,
  mode = 'student',
  nearbyDrivers = [],
  currentLocation
}: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{
    pickup: mapboxgl.Marker | null;
    dropoff: mapboxgl.Marker | null;
    drivers: mapboxgl.Marker[];
    current: mapboxgl.Marker | null;
  }>({
    pickup: null,
    dropoff: null,
    drivers: [],
    current: null
  });
  const { mapboxToken } = useMap();

  const CAMPUS_CENTER = [3.7242, 6.8923] as [number, number];
  const CAMPUS_BOUNDS = [
    [3.7192, 6.8873], // Southwest coordinates
    [3.7292, 6.8973]  // Northeast coordinates
  ] as [[number, number], [number, number]];

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: CAMPUS_CENTER,
      zoom: 16,
      minZoom: 15,
      maxZoom: 19,
      maxBounds: CAMPUS_BOUNDS
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Handle selected locations (pickup/dropoff)
  useEffect(() => {
    if (!map.current || !selectedLocations) return;

    // Clear existing markers
    if (markerRefs.current.pickup) {
      markerRefs.current.pickup.remove();
      markerRefs.current.pickup = null;
    }
    if (markerRefs.current.dropoff) {
      markerRefs.current.dropoff.remove();
      markerRefs.current.dropoff = null;
    }

    // Add new markers
    if (selectedLocations.pickup) {
      markerRefs.current.pickup = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat])
        .addTo(map.current);
    }

    if (selectedLocations.dropoff) {
      markerRefs.current.dropoff = new mapboxgl.Marker({ color: '#EF4444' })
        .setLngLat([selectedLocations.dropoff.coordinates.lng, selectedLocations.dropoff.coordinates.lat])
        .addTo(map.current);
    }

    // Fit bounds to show both markers
    if (selectedLocations.pickup && selectedLocations.dropoff) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat])
        .extend([selectedLocations.dropoff.coordinates.lng, selectedLocations.dropoff.coordinates.lat]);

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 18
      });

      if (showRoutePath) {
        drawRoute(
          [selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat],
          [selectedLocations.dropoff.coordinates.lng, selectedLocations.dropoff.coordinates.lat]
        );
      }
    }
  }, [selectedLocations, showRoutePath]);

  // Handle nearby drivers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing driver markers
    markerRefs.current.drivers.forEach(marker => marker.remove());
    markerRefs.current.drivers = [];

    // Add new driver markers
    nearbyDrivers.forEach(driver => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([driver.lng, driver.lat])
        .addTo(map.current!);
      
      markerRefs.current.drivers.push(marker);
    });
  }, [nearbyDrivers]);

  // Handle current location (for driver mode)
  useEffect(() => {
    if (!map.current || !currentLocation) return;

    if (markerRefs.current.current) {
      markerRefs.current.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center';
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>';

    markerRefs.current.current = new mapboxgl.Marker({ element: el })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(map.current);

    map.current.flyTo({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 17,
      speed: 1
    });
  }, [currentLocation]);

  const drawRoute = async (pickup: [number, number], dropoff: [number, number]) => {
    if (!map.current || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.join(',')};${dropoff.join(',')}?geometries=geojson&access_token=${mapboxToken}`
      );

      const data = await response.json();

      if (data.routes?.[0]) {
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: data.routes[0].geometry
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
                geometry: data.routes[0].geometry
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
      }
    } catch (error) {
      console.error('Error drawing route:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapboxLocationManager;
