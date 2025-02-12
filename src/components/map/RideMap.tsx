
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Driver } from '@/types';
import { Card } from '../ui/card';
import { Loader2, Sun, Moon } from 'lucide-react';

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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with style based on time of day
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

    // Add navigation controls with elegant styling
    const nav = new mapboxgl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    });
    map.current.addControl(nav, 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Initialize route layer when map loads
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

        // Add animated route glow effect
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

        getCoordinatesAndUpdateRoute();
      }

      // Add atmosphere effect
      map.current?.setFog({
        'horizon-blend': 0.1,
        'star-intensity': 0.15,
        'space-color': '#000000',
        'color': mapStyle === 'dark' ? '#242424' : '#ffffff'
      });
    });

    // Handle driver mode specific features
    if (mode === 'driver') {
      // Add geolocation control with custom styling
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
      );

      // Add click handler for driver location updates
      if (onDriverLocationUpdate) {
        map.current.on('click', (e) => {
          onDriverLocationUpdate(e.lngLat.lng, e.lngLat.lat);
        });
      }
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  // Handle map style toggle
  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'light' ? 'dark' : 'light';
    setMapStyle(newStyle);
    map.current?.setStyle(`mapbox://styles/mapbox/${newStyle}-v11`);
  };

  // Handle driver location updates with smooth animation
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    if (!driverMarker.current) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.style.cssText = `
        background-color: #4ade80;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      // Add pulse animation
      const pulse = document.createElement('div');
      pulse.style.cssText = `
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: #4ade8050;
        transform: translate(-5px, -5px);
        animation: pulse 2s infinite;
      `;
      el.appendChild(pulse);

      driverMarker.current = new mapboxgl.Marker({
        element: el,
        rotationAlignment: 'map'
      })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current);
    } else {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    }

    // Smooth camera animation
    map.current.easeTo({
      center: [driverLocation.lng, driverLocation.lat],
      duration: 2000,
      easing: (t) => t * (2 - t) // Smooth easing function
    });
  }, [driverLocation]);

  // Handle nearby drivers with animated markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers with animation
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
  }, [nearbyDrivers]);

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
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={toggleMapStyle}
        >
          {mapStyle === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default RideMap;
