
import React, { createContext, useContext, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  isLoaded: boolean;
  error: string | null;
  mapboxToken: string | null;
}

const MapContext = createContext<MapContextType>({
  isLoaded: false,
  error: null,
  mapboxToken: null,
});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Validate token and set up Mapbox
  if (!mapboxToken) {
    console.error('Missing Mapbox access token');
    setError('Failed to load map configuration - missing access token');
  } else {
    // Set the token globally for mapbox-gl
    mapboxgl.accessToken = mapboxToken;
  }

  return (
    <MapContext.Provider value={{ 
      isLoaded: !error && !!mapboxToken, 
      error, 
      mapboxToken 
    }}>
      {children}
    </MapContext.Provider>
  );
};
