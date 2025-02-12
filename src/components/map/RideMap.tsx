
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '../ui/input';

interface RideMapProps {
  pickup: string;
  dropoff: string;
  className?: string;
  showRoutePath?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

const RideMap = ({ 
  pickup, 
  dropoff, 
  className = "",
  showRoutePath = true,
  onRouteCalculated 
}: RideMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 12,
      center: [3.4470, 6.4552], // Default to Lagos coordinates
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());

    if (showRoutePath) {
      // Add source and layer for the route
      map.current.on('load', () => {
        // Add the route layer
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
            'line-opacity': 0.75
          }
        });

        // Get coordinates and update route
        getCoordinatesAndUpdateRoute();
      });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, pickup, dropoff, showRoutePath]);

  const getCoordinatesAndUpdateRoute = async () => {
    if (!mapboxToken) return;

    try {
      // Get coordinates for pickup and dropoff
      const pickupCoords = await getCoordinates(pickup);
      const dropoffCoords = await getCoordinates(dropoff);

      if (pickupCoords && dropoffCoords) {
        // Add markers
        new mapboxgl.Marker({ color: '#22c55e' })
          .setLngLat(pickupCoords)
          .addTo(map.current!);

        new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(dropoffCoords)
          .addTo(map.current!);

        // Get route
        const route = await getRoute(pickupCoords, dropoffCoords);
        
        if (route) {
          // Update the route layer
          (map.current?.getSource('route') as mapboxgl.GeoJSONSource)?.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.geometry.coordinates
            }
          });

          // Fit bounds to show the entire route
          const bounds = new mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach((coord) => {
            bounds.extend(coord as mapboxgl.LngLatLike);
          });
          
          map.current?.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          });

          // Calculate and return distance and duration
          if (onRouteCalculated) {
            const distance = route.distance / 1000; // Convert to km
            const duration = route.duration / 60; // Convert to minutes
            onRouteCalculated(distance, duration);
          }
        }
      }
    } catch (error) {
      console.error('Error updating route:', error);
    }
  };

  const getCoordinates = async (location: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();
      if (data.features?.length > 0) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  const getRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxToken}`
      );
      const data = await response.json();
      return data.routes[0];
    } catch (error) {
      console.error('Error getting route:', error);
      return null;
    }
  };

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsTokenSet(true);
  };

  if (!isTokenSet) {
    return (
      <form onSubmit={handleTokenSubmit} className="space-y-4 p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">
          Please enter your Mapbox public token to view the map. You can get one at{" "}
          <a 
            href="https://www.mapbox.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
          </a>
        </p>
        <Input
          type="text"
          placeholder="Enter your Mapbox token"
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.target.value)}
          required
        />
        <Button type="submit">Set Token</Button>
      </form>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[300px]" />
    </div>
  );
};

export default RideMap;
