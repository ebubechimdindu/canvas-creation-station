
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type CampusLocation, type LocationCategory } from '@/types/locations';
import { Loader2, MapPin, Plus } from 'lucide-react';

interface LocationManagerProps {
  onLocationSelect?: (location: CampusLocation) => void;
  mode?: 'view' | 'edit';
}

const LocationManager = ({ onLocationSelect, mode = 'view' }: LocationManagerProps) => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('campus_locations')
        .select('*')
        .order('name');

      if (error) throw error;

      const transformedLocations: CampusLocation[] = data.map(location => ({
        id: location.id,
        name: location.name,
        description: location.description,
        category: location.category,
        coordinates: {
          lat: location.coordinates[1],
          lng: location.coordinates[0]
        },
        isActive: location.is_active,
        isVerified: location.is_verified,
        buildingCode: location.building_code,
        commonNames: location.common_names,
        entrancePoints: location.entrance_points?.map((point: any) => ({
          lat: point.lat,
          lng: point.lng,
          description: point.description
        })) || [],
        createdAt: location.created_at,
        updatedAt: location.updated_at
      }));

      setLocations(transformedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campus locations',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.buildingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.commonNames?.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Campus Locations</CardTitle>
        {mode === 'edit' && (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-[200px]">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as LocationCategory | 'all')}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="residence">Residence</SelectItem>
                  <SelectItem value="common_area">Common Area</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="pickup_point">Pickup Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>No locations found</p>
              </div>
            ) : (
              filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onLocationSelect?.(location)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {location.buildingCode && `${location.buildingCode} • `}
                        {location.category.replace('_', ' ')}
                      </p>
                    </div>
                    {location.isVerified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationManager;
