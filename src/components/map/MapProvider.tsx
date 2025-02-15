
import React, { createContext, useContext } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  mapboxToken: string;
}

const MapContext = createContext<MapContextType>({
  mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    console.error('Missing Mapbox access token');
    return null;
  }

  // Set the token globally for mapbox-gl
  mapboxgl.accessToken = mapboxToken;

  return (
    <MapContext.Provider value={{ mapboxToken }}>
      {children}
    </MapContext.Provider>
  );
};
