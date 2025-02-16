
import React, { createContext, useContext, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapContextType {
  mapboxToken: string | null;
  isLoading: boolean;
  error: Error | null;
}

const MapContext = createContext<MapContextType>({
  mapboxToken: null,
  isLoading: true,
  error: null
});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error: tokenError } = await supabase
          .rpc('get_secret', { name: 'MAPBOX_ACCESS_TOKEN' });

        if (tokenError) {
          throw new Error('Failed to fetch Mapbox token');
        }

        if (!data) {
          throw new Error('Mapbox token not found');
        }

        setMapboxToken(data);
        mapboxgl.accessToken = data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        toast({
          title: "Error",
          description: "Failed to initialize map. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapboxToken();
  }, [toast]);

  if (isLoading) {
    return <div>Loading map configuration...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <MapContext.Provider value={{ mapboxToken, isLoading, error }}>
      {children}
    </MapContext.Provider>
  );
};

