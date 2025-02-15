
import React, { createContext, useContext, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/hooks/use-toast';

interface MapContextType {
  mapboxToken: string;
  isLoaded: boolean;
}

const MapContext = createContext<MapContextType>({
  mapboxToken: '',
  isLoaded: false
});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const { toast } = useToast();

  useEffect(() => {
    if (!mapboxToken) {
      toast({
        title: 'Map Error',
        description: 'Missing Mapbox access token. Please check your configuration.',
        variant: 'destructive'
      });
      return;
    }

    // Set the token globally for mapbox-gl
    mapboxgl.accessToken = mapboxToken;
  }, [mapboxToken]);

  if (!mapboxToken) {
    return null;
  }

  return (
    <MapContext.Provider value={{ mapboxToken, isLoaded: true }}>
      {children}
    </MapContext.Provider>
  );
};
