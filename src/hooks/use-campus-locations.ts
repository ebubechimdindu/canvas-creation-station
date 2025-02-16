
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CampusLocation } from '@/types/locations';
import { useToast } from '@/hooks/use-toast';

export function useCampusLocations() {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLocations() {
      try {
        const { data, error: fetchError } = await supabase
          .from('campus_locations')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (fetchError) throw fetchError;

        if (data) {
          const transformedLocations: CampusLocation[] = data.map(location => ({
            id: location.id,
            name: location.name,
            description: location.description || undefined,
            locationType: location.location_type as CampusLocation['locationType'],
            coordinates: {
              lat: location.coordinates[1],
              lng: location.coordinates[0]
            },
            isActive: location.is_active,
            isVerified: location.is_verified,
            buildingCode: location.building_code || undefined,
            commonNames: location.common_names || undefined,
            createdAt: location.created_at,
            updatedAt: location.updated_at
          }));
          setLocations(transformedLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to fetch campus locations');
        toast({
          title: 'Error',
          description: 'Failed to load campus locations. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, [toast]);

  return { locations, isLoading, error };
}
