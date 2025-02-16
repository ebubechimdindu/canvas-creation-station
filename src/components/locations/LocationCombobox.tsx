
import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { type CampusLocation } from "@/types/locations";

interface LocationComboboxProps {
  value: string;
  onSelect: (location: CampusLocation) => void;
  locations: CampusLocation[];
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isLoading?: boolean;
}

const typeLabels: Record<string, string> = {
  academic: "Academic Buildings",
  residence: "Residential Halls",
  common_area: "Common Areas",
  administrative: "Administrative",
  pickup_point: "Pickup Points",
  dropoff_point: "Dropoff Points",
};

export function LocationCombobox({
  value,
  onSelect,
  locations = [],
  placeholder = "Select location...",
  onFocus,
  onBlur,
  isLoading = false,
}: LocationComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Group locations by type with additional safety checks
  const groupedLocations = React.useMemo(() => {
    if (!Array.isArray(locations)) {
      console.warn('Locations prop is not an array');
      return {};
    }

    const validLocations = locations.filter((loc): loc is CampusLocation => 
      Boolean(loc) && 
      typeof loc === 'object' && 
      'name' in loc && 
      'locationType' in loc
    );

    return validLocations.reduce((groups, location) => {
      const type = location.locationType || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(location);
      return groups;
    }, {} as Record<string, CampusLocation[]>);
  }, [locations]);

  // Find selected location with strict type checking
  const selectedLocation = React.useMemo(() => {
    if (!Array.isArray(locations)) return null;
    return locations.find(loc => loc && loc.name === value) || null;
  }, [locations, value]);

  // Ensure we have valid data for the Command component
  const commandGroups = React.useMemo(() => {
    return Object.entries(groupedLocations).filter(([_, locs]) => 
      Array.isArray(locs) && locs.length > 0
    );
  }, [groupedLocations]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            )}
            <span className="truncate">
              {selectedLocation ? selectedLocation.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search locations..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading locations...</p>
              </div>
            ) : commandGroups.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No locations available
              </div>
            ) : (
              commandGroups.map(([type, locations]) => {
                if (!Array.isArray(locations)) return null;

                const filteredLocations = locations.filter(location => 
                  location && typeof location.name === 'string' && (
                    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Array.isArray(location.commonNames) && location.commonNames.some(name => 
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  )
                );

                if (filteredLocations.length === 0) return null;

                return (
                  <CommandGroup key={type} heading={typeLabels[type] || type}>
                    {filteredLocations.map((location) => (
                      <CommandItem
                        key={location.id}
                        value={location.name || ""}
                        onSelect={() => {
                          onSelect(location);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span>{location.name}</span>
                          {location.buildingCode && (
                            <Badge variant="secondary" className="text-xs">
                              {location.buildingCode}
                            </Badge>
                          )}
                        </div>
                        {location.name === value && (
                          <Check className="h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
            {!isLoading && searchQuery && commandGroups.length > 0 && 
              Object.values(groupedLocations)
                .flat()
                .filter(loc => 
                  loc && typeof loc.name === 'string' && (
                    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Array.isArray(loc.commonNames) && loc.commonNames.some(name => 
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  )
                ).length === 0 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
