
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type CampusLocation, type LocationType } from '@/types/locations';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export function useCampusLocations() {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('campus_locations')
        .select('*')
        .order('name');

      if (supabaseError) throw supabaseError;

      const transformedLocations: CampusLocation[] = data.map(location => ({
        id: location.id,
        name: location.name,
        description: location.description,
        locationType: location.location_type as LocationType,
        coordinates: {
          lat: Number(location.coordinates[1]),
          lng: Number(location.coordinates[0])
        },
        isActive: location.is_active,
        isVerified: location.is_verified,
        buildingCode: location.building_code,
        commonNames: location.common_names,
        entrancePoints: location.entrance_points?.map((point: any) => ({
          lat: Number(point.lat),
          lng: Number(point.lng),
          description: point.description
        })),
        createdAt: location.created_at,
        updatedAt: location.updated_at
      }));

      setLocations(transformedLocations);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitLocationFeedback = async (
    locationId: string,
    feedback: {
      feedbackType: string;
      description?: string;
      suggestedCoordinates?: { lat: number; lng: number };
    }
  ) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to submit feedback');
      }

      const { error: feedbackError } = await supabase
        .from('location_feedback')
        .insert({
          location_id: locationId,
          feedback_type: feedback.feedbackType,
          description: feedback.description,
          suggested_coordinates: feedback.suggestedCoordinates 
            ? `(${feedback.suggestedCoordinates.lng},${feedback.suggestedCoordinates.lat})`
            : null,
          submitted_by: user.id
        });

      if (feedbackError) throw feedbackError;

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for helping improve our location data!',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
    submitLocationFeedback
  };
}
