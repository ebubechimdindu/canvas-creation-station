
import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2, Clock, Star } from "lucide-react";
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
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { addLocation } from "@/features/locations/locationHistorySlice";
import { formatDistanceToNow } from "date-fns";

interface LocationComboboxProps {
  value: string;
  onSelect: (location: CampusLocation) => void;
  locations: CampusLocation[];
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isLoading?: boolean;
  type: 'pickup' | 'dropoff';
}

export function LocationCombobox({
  value,
  onSelect,
  locations = [],
  placeholder = "Select location...",
  onFocus,
  onBlur,
  isLoading = false,
  type,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useAppDispatch();
  const { recentLocations, frequentLocations } = useAppSelector(
    (state) => state.locationHistory
  );

  const handleLocationSelect = (location: CampusLocation) => {
    onSelect(location);
    dispatch(addLocation({ location, type }));
    setOpen(false);
  };

  const renderLocationItem = (location: CampusLocation, meta?: { lastUsed?: string; useCount?: number }) => (
    <CommandItem
      key={location.id}
      value={location.name}
      onSelect={() => handleLocationSelect(location)}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>{location.name}</span>
        {location.buildingCode && (
          <Badge variant="secondary" className="text-xs">
            {location.buildingCode}
          </Badge>
        )}
      </div>
      {meta && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {meta.useCount && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {meta.useCount}
            </span>
          )}
          {meta.lastUsed && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(meta.lastUsed), { addSuffix: true })}
            </span>
          )}
        </div>
      )}
    </CommandItem>
  );

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
              {value || placeholder}
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
            ) : (
              <>
                {recentLocations[type].length > 0 && (
                  <CommandGroup heading="Recent Locations">
                    {recentLocations[type].map((entry) => 
                      renderLocationItem(entry.location, { lastUsed: entry.lastUsed })
                    )}
                  </CommandGroup>
                )}
                
                {frequentLocations[type].length > 0 && (
                  <CommandGroup heading="Most Visited">
                    {frequentLocations[type].map((entry) => 
                      renderLocationItem(entry.location, { useCount: entry.useCount })
                    )}
                  </CommandGroup>
                )}

                <CommandGroup heading="All Locations">
                  {locations
                    .filter(location => 
                      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (location.commonNames?.some(name => 
                        name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                    )
                    .map((location) => renderLocationItem(location))}
                </CommandGroup>
              </>
            )}
            {!isLoading && searchQuery && locations.length > 0 && 
              locations.filter(loc => 
                loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (loc.commonNames?.some(name => 
                  name.toLowerCase().includes(searchQuery.toLowerCase()))
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

