
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Driver } from '@/types';
import { Card } from '../ui/card';
import { Loader2, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch Mapbox token from Supabase
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_secret', { name: 'MAPBOX_ACCESS_TOKEN' });

        if (error) {
          console.error('Error fetching Mapbox token:', error);
          return;
        }

        if (data) {
          setMapboxToken(data);
          mapboxgl.accessToken = data;
          initializeMap();
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      }
    };

    fetchMapboxToken();
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    const hour = new Date().getHours();
    const initialStyle = hour >= 18 || hour < 6 ? 'dark' : 'light';
    setMapStyle(initialStyle);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${initialStyle}-v11`,
      center: driverLocation ? [driverLocation.lng, driverLocation.lat] : [3.4470, 6.4552],
      zoom: 12,
      pitchWithRotate: true,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    }), 'top-right');

    map.current.addControl(new mapboxgl.FullscreenControl());

    map.current.on('load', () => {
      setIsMapLoaded(true);
      setIsLoading(false);

      if (showRoutePath) {
        map.current?.addSource('route', {
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

        map.current?.addLayer({
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
            'line-opacity': 0.75,
            'line-gradient': [
              'interpolate',
              ['linear'],
              ['line-progress'],
              0, '#3b82f6',
              1, '#10b981'
            ]
          }
        });

        map.current?.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 8,
            'line-opacity': 0.15,
            'line-blur': 2
          }
        });
      }

      map.current?.setFog({
        'horizon-blend': 0.1,
        'star-intensity': 0.15,
        'space-color': '#000000',
        'color': mapStyle === 'dark' ? '#242424' : '#ffffff'
      });
    });

    if (mode === 'driver') {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
      );

      if (onDriverLocationUpdate) {
        map.current.on('click', (e) => {
          onDriverLocationUpdate(e.lngLat.lat, e.lngLat.lng);
        });
      }
    }
  };

  // Update nearby drivers markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers for nearby drivers
    nearbyDrivers.forEach(driver => {
      if (driver.currentLocation) {
        const el = document.createElement('div');
        el.className = 'nearby-driver-marker';
        el.style.cssText = `
          background-color: ${driver.status === 'available' ? '#4ade80' : '#ef4444'};
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          animation: bounce 1s infinite;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([driver.currentLocation.lng, driver.currentLocation.lat])
          .addTo(map.current!);

        markersRef.current[driver.id] = marker;
      }
    });
  }, [nearbyDrivers, isMapLoaded]);

  if (isLoading) {
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
      <div ref={mapContainer} className="w-full h-full min-h-[300px]" />
      
      <div className="absolute top-4 left-4 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={() => {
            const newStyle = mapStyle === 'light' ? 'dark' : 'light';
            setMapStyle(newStyle);
            map.current?.setStyle(`mapbox://styles/mapbox/${newStyle}-v11`);
          }}
        >
          {mapStyle === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: translate(-5px, -5px) scale(1);
              opacity: 0.8;
            }
            70% {
              transform: translate(-5px, -5px) scale(2);
              opacity: 0;
            }
            100% {
              transform: translate(-5px, -5px) scale(1);
              opacity: 0;
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default RideMap;
