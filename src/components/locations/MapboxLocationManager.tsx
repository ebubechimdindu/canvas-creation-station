
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type CampusLocation, type LocationCategory } from '@/types/locations';
import { Loader2, MapPin, Search, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MapboxLocationManagerProps {
  onLocationSelect?: (location: CampusLocation) => void;
  onCoordinatesSelect?: (lat: number, lng: number) => void;
}

const MapboxLocationManager = ({ onLocationSelect, onCoordinatesSelect }: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const { toast } = useToast();
  const selectedMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}-v12`,
      center: [3.7181, 6.8917], // Babcock University center
      zoom: 16,
      pitchWithRotate: true,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    map.current.on('load', () => {
      setIsLoading(false);
    });

    // Add click handler for coordinate selection
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Remove previous marker if it exists
      if (selectedMarker.current) {
        selectedMarker.current.remove();
      }

      // Create new marker
      selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      onCoordinatesSelect?.(lat, lng);

      // Show coordinates in toast
      toast({
        title: 'Location Selected',
        description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapStyle]);

  // Function to handle map style toggle
  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
    setMapStyle(newStyle);
  };

  // Function to search for a location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Build the search query with Babcock University context
      const query = `${searchQuery} Babcock University Ilishan-Remo`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=3.7181,6.8917&access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        const [lng, lat] = location.center;

        // Remove previous marker if it exists
        if (selectedMarker.current) {
          selectedMarker.current.remove();
        }

        // Add marker for the found location
        selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Fly to the location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 18,
          duration: 2000,
          essential: true
        });

        onCoordinatesSelect?.(lat, lng);

        toast({
          title: 'Location Found',
          description: location.place_name,
        });
      } else {
        toast({
          title: 'No Results',
          description: 'No locations found matching your search',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search for location',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Campus Location Manager</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMapStyle}
          className="ml-2"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search">Search Location</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search for a campus location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        <p className="text-sm text-muted-foreground">
          Click on the map to select a location or use the search bar to find specific campus buildings.
        </p>
      </CardContent>
    </Card>
  );
};

export default MapboxLocationManager;
