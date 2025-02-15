
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  properties: {
    category?: string;
    address?: string;
  };
}

interface MapboxLandmark {
  id: string;
  name: string;
  coordinates: [number, number];
  category?: string;
  address?: string;
}

export const useMapboxLandmarks = () => {
  const [landmarks, setLandmarks] = useState<MapboxLandmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const CAMPUS_BOUNDS = [
    [3.7192, 6.8873], // Southwest coordinates
    [3.7292, 6.8973]  // Northeast coordinates
  ];

  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!mapboxToken) {
          throw new Error('Mapbox token not found');
        }

        // Query Mapbox Geocoding API with a bbox filter for Babcock University area
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/babcock%20university.json?proximity=3.7242,6.8923&bbox=${CAMPUS_BOUNDS[0].join(',')},${CAMPUS_BOUNDS[1].join(',')}&types=poi&limit=50&access_token=${mapboxToken}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch landmarks');
        }

        const data = await response.json();
        
        // Transform and filter the features
        const transformedLandmarks: MapboxLandmark[] = data.features
          .filter((feature: MapboxFeature) => {
            // Ensure the feature is within campus bounds
            const [lng, lat] = feature.center;
            return (
              lng >= CAMPUS_BOUNDS[0][0] && lng <= CAMPUS_BOUNDS[1][0] &&
              lat >= CAMPUS_BOUNDS[0][1] && lat <= CAMPUS_BOUNDS[1][1]
            );
          })
          .map((feature: MapboxFeature) => ({
            id: feature.id,
            name: feature.place_name.split(',')[0], // Get just the landmark name
            coordinates: feature.center,
            category: feature.properties.category,
            address: feature.properties.address
          }));

        setLandmarks(transformedLandmarks);
        console.log('Fetched landmarks:', transformedLandmarks);
      } catch (err) {
        console.error('Error fetching landmarks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch landmarks');
        toast({
          title: 'Error',
          description: 'Failed to fetch campus landmarks',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandmarks();
  }, []);

  return { landmarks, isLoading, error };
};
