
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type CampusLocation } from '@/types/locations';
import { Loader2, MapPin, Search, Layers } from 'lucide-react';
import { useMap } from '../map/MapProvider';

interface MapboxLocationManagerProps {
  onLocationSelect?: (location: CampusLocation) => void;
  onCoordinatesSelect?: (lat: number, lng: number) => void;
  className?: string;
}

const MapboxLocationManager = ({ 
  onLocationSelect, 
  onCoordinatesSelect,
  className = ""
}: MapboxLocationManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const { toast } = useToast();
  const selectedMarker = useRef<mapboxgl.Marker | null>(null);
  const { isLoaded, error, mapboxToken } = useMap();

  // Initialize map when the container is ready and we have the token
  useEffect(() => {
    if (!mapContainer.current || map.current || !isLoaded || !mapboxToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}-v12`,
      center: [3.7181, 6.8917], // Babcock University center
      zoom: 16,
      pitchWithRotate: true,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    map.current.on('load', () => {
      setIsLoading(false);
    });

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      if (selectedMarker.current) {
        selectedMarker.current.remove();
      }

      selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      onCoordinatesSelect?.(lat, lng);

      toast({
        title: 'Location Selected',
        description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [isLoaded, mapStyle, mapboxToken]);

  // Update map style when it changes
  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${mapStyle}-v12`);
  }, [mapStyle]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const query = `${searchQuery} Babcock University Ilishan-Remo`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=3.7181,6.8917&access_token=${mapboxToken}`
      );

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        const [lng, lat] = location.center;

        if (selectedMarker.current) {
          selectedMarker.current.remove();
        }

        selectedMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
          .setLngLat([lng, lat])
          .addTo(map.current!);

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

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center text-red-500">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Campus Location Manager</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
            setMapStyle(newStyle);
          }}
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
