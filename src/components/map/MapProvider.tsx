
import React, { createContext, useContext, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '../ui/card';
import { Loader2 } from 'lucide-react';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeMapbox = async () => {
      try {
        const { data: token, error: rpcError } = await supabase
          .rpc('get_secret', { name: 'MAPBOX_ACCESS_TOKEN' });

        if (rpcError) {
          console.error('Error fetching Mapbox token:', rpcError);
          setError('Failed to load map configuration');
          return;
        }

        if (!token) {
          console.error('No Mapbox token found');
          setError('Invalid map configuration - token not found');
          return;
        }

        // Set the token globally for mapbox-gl
        mapboxgl.accessToken = token;
        setMapboxToken(token);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to initialize Mapbox:', err);
        setError('Failed to initialize map');
      }
    };

    initializeMapbox();
  }, []);

  if (error) {
    return (
      <Card className="p-4 text-center text-red-500">
        <p>{error}</p>
        <p className="text-sm mt-2 text-muted-foreground">
          Please contact support if this issue persists.
        </p>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Loading map configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <MapContext.Provider value={{ isLoaded, error, mapboxToken }}>
      {children}
    </MapContext.Provider>
  );
};
