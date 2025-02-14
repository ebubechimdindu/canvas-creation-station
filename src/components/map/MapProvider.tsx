
import React, { createContext, useContext, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface MapContextType {
  isLoaded: boolean;
  error: string | null;
}

const MapContext = createContext<MapContextType>({
  isLoaded: false,
  error: null,
});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMapbox = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_secret', { name: 'MAPBOX_ACCESS_TOKEN' }) as { data: string | null; error: unknown };

        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setError('Failed to load map configuration');
          return;
        }

        if (typeof data === 'string') {
          mapboxgl.accessToken = data;
          setIsLoaded(true);
        } else {
          setError('Invalid map configuration');
        }
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
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <MapContext.Provider value={{ isLoaded, error }}>
      {children}
    </MapContext.Provider>
  );
};
