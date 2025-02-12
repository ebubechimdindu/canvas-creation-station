
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
  onReset: () => void;
}

export function SearchFilters({ onSearch, onReset }: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date>();
  const [status, setStatus] = useState<string>("");

  const handleSearch = () => {
    onSearch({
      searchTerm,
      date,
      status,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setDate(undefined);
    setStatus("");
    onReset();
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1">
        <Input
          placeholder="Search locations or student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-[240px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Upcoming">Upcoming</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
