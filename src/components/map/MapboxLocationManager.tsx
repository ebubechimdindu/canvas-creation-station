
import { useEffect, useRef, useState } from 'react';
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
}

const MapboxLocationManager = ({
  selectedLocations,
  showRoutePath = false,
  mode = 'student',
  nearbyDrivers = []
}: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { mapboxToken } = useMap();
  const markerRefs = useRef<{
    pickup: mapboxgl.Marker | null;
    dropoff: mapboxgl.Marker | null;
    drivers: mapboxgl.Marker[];
  }>({
    pickup: null,
    dropoff: null,
    drivers: []
  });

  const CAMPUS_CENTER = [3.7242, 6.8923] as [number, number];
  const CAMPUS_BOUNDS = [
    [3.7192, 6.8873], // Southwest coordinates
    [3.7292, 6.8973]  // Northeast coordinates
  ] as [[number, number], [number, number]];

  const MARKER_COLORS = {
    pickup: '#3B82F6', // Blue
    dropoff: '#EF4444', // Red
    driver: '#10B981'  // Green
  };

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

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
      markerRefs.current.pickup = new mapboxgl.Marker({ color: MARKER_COLORS.pickup })
        .setLngLat([selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat])
        .addTo(map.current);
    }

    if (selectedLocations.dropoff) {
      markerRefs.current.dropoff = new mapboxgl.Marker({ color: MARKER_COLORS.dropoff })
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
        maxZoom: 19
      });

      if (showRoutePath) {
        drawRoute(
          [selectedLocations.pickup.coordinates.lng, selectedLocations.pickup.coordinates.lat],
          [selectedLocations.dropoff.coordinates.lng, selectedLocations.dropoff.coordinates.lat]
        );
      }
    }
  }, [selectedLocations, showRoutePath]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing driver markers
    markerRefs.current.drivers.forEach(marker => marker.remove());
    markerRefs.current.drivers = [];

    // Add new driver markers
    nearbyDrivers.forEach(driver => {
      const marker = new mapboxgl.Marker({ color: MARKER_COLORS.driver })
        .setLngLat([driver.lng, driver.lat])
        .addTo(map.current!);
      markerRefs.current.drivers.push(marker);
    });
  }, [nearbyDrivers]);

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
