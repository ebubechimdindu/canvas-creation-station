
import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
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
  locations,
  placeholder = "Select location...",
  onFocus,
  onBlur,
}: LocationComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Group locations by type
  const groupedLocations = React.useMemo(() => {
    return locations.reduce((groups, location) => {
      const type = location.locationType || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(location);
      return groups;
    }, {} as Record<string, CampusLocation[]>);
  }, [locations]);

  const selectedLocation = locations.find(location => location.name === value);

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
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
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
            {Object.entries(groupedLocations).map(([type, locs]) => {
              const filteredLocations = locs.filter(loc => 
                loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (loc.commonNames?.some(name => 
                  name.toLowerCase().includes(searchQuery.toLowerCase())
                ))
              );

              if (filteredLocations.length === 0) return null;

              return (
                <CommandGroup key={type} heading={typeLabels[type] || type}>
                  {filteredLocations.map((location) => (
                    <CommandItem
                      key={location.id}
                      value={location.name}
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
            })}
            <CommandEmpty>No locations found.</CommandEmpty>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
