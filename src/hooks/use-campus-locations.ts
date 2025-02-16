
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CampusLocation, LocationCategory } from '@/types/locations';

export const useCampusLocations = () => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('campus_locations')
          .select('*')
          .order('name');

        if (fetchError) throw fetchError;

        if (data) {
          const transformedLocations: CampusLocation[] = data.map(location => ({
            id: location.id,
            name: location.name,
            description: location.description,
            locationType: location.location_type as LocationCategory,
            coordinates: {
              lat: location.coordinates[1],
              lng: location.coordinates[0]
            },
            isActive: location.is_active,
            isVerified: location.is_verified,
            buildingCode: location.building_code,
            commonNames: location.common_names,
            createdAt: location.created_at,
            updatedAt: location.updated_at
          }));
          setLocations(transformedLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to fetch campus locations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, isLoading, error };
};
