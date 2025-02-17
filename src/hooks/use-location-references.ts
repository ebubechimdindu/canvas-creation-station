
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LocationReference, LocationWithReferences } from '@/types/locations';
import { useToast } from '@/hooks/use-toast';

export const useLocationReferences = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getNearbyReferences = async (lat: number, lng: number): Promise<LocationReference[]> => {
    try {
      setIsLoading(true);
      const point = `POINT(${lng} ${lat})`;
      
      const { data, error } = await supabase
        .rpc('find_nearest_references', {
          point: point
        });

      if (error) throw error;

      return data.map(ref => ({
        id: ref.id,
        name: ref.name,
        referenceType: ref.reference_type,
        description: ref.description,
        distance: Math.round(ref.distance)
      }));

    } catch (error) {
      console.error('Error getting nearby references:', error);
      toast({
        title: "Error",
        description: "Failed to get nearby locations",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const formatLocationDescription = (references: LocationReference[]): string => {
    if (references.length === 0) return "Selected location";
    
    const nearest = references[0];
    const distance = nearest.distance;
    
    if (distance < 10) {
      return `At ${nearest.name}`;
    } else {
      return `${distance}m from ${nearest.name}`;
    }
  };

  return {
    getNearbyReferences,
    formatLocationDescription,
    isLoading
  };
};

