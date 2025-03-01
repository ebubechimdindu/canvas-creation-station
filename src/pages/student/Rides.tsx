
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import type { RideRequest, RideStatusUI, RideStatus, RideRating } from '@/types';

interface StudentRide extends RideRequest {
  statusUI: RideStatusUI;
}

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
})

const Rides = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeRide, setActiveRide] = useState<StudentRide | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const form = useForm<z.infer<typeof ratingSchema>>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5,
      review: "",
    },
  })

  const { data: rides, isLoading, error } = useQuery({
    queryKey: ['studentRides'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from<"ride_requests", "public">('ride_requests')
        .select(`*, ratings (*)`)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (date?.from && date?.to) {
        query = query.gte('created_at', date.from.toISOString());
        query = query.lte('created_at', date.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(ride => ({
        ...ride,
        statusUI: mapRideStatusToUI(ride.status as RideStatus)
      })) as StudentRide[];
    },
  });

  useEffect(() => {
    if (rides && rides.length > 0) {
      setActiveRide(rides[0]);
    }
  }, [rides]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const mapRideStatusToUI = (status: RideStatus): RideStatusUI => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'requested':
      case 'finding_driver':
      case 'driver_assigned':
        return 'Upcoming';
      case 'en_route_to_pickup':
      case 'arrived_at_pickup':
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
      case 'timeout':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  };

  const handleRating = async (rideId: number, rating: number, review: string) => {
    try {
      const { error } = await supabase
        .from('ride_ratings')
        .insert({
          ride_id: rideId,
          rating,
          comment: review,
          rated_by: activeRide?.student_id,
          driver_id: activeRide?.driver_id
        });

      if (error) throw error;

      setIsRatingModalOpen(false);
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating has been submitted successfully.",
      });
      
      // Refresh ride data to update UI
      queryClient.invalidateQueries({ queryKey: ['studentRides'] });

    } catch (error) {
      console.error("Error submitting rating: ", error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Rides</h1>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            pagedNavigation
          />
        </PopoverContent>
      </Popover>

      <Accordion type="single" collapsible className="w-full">
        {rides?.map(ride => (
          <AccordionItem key={ride.id} value={String(ride.id)}>
            <AccordionTrigger onClick={() => setActiveRide(ride)}>
              {ride.pickup_address} to {ride.dropoff_address} - {ride.statusUI}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Pickup:</strong> {ride.pickup_address}</p>
                  <p><strong>Dropoff:</strong> {ride.dropoff_address}</p>
                  <p><strong>Status:</strong> {ride.statusUI}</p>
                  <p><strong>Date:</strong> {ride.created_at}</p>
                  {ride.notes && <p><strong>Notes:</strong> {ride.notes}</p>}
                  {ride.special_requirements && <p><strong>Special Requirements:</strong> {ride.special_requirements}</p>}
                </div>
                <div>
                  {ride.ratings && ride.ratings.length === 0 && ride.status === 'completed' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Rate Ride</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Rate Your Ride</DialogTitle>
                          <DialogDescription>
                            How was your experience?
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit((values) => handleRating(ride.id, values.rating, values.review))} className="space-y-8">
                            <FormField
                              control={form.control}
                              name="rating"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rating</FormLabel>
                                  <FormControl>
                                    <Slider
                                      defaultValue={[5]}
                                      max={5}
                                      min={1}
                                      step={1}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Please select a rating between 1 and 5.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="review"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Review</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Write your review here."
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Tell us more about your experience.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit">Submit Rating</Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {ride.ratings && ride.ratings.length > 0 && (
                    <div>
                      <p><strong>Your Rating:</strong> {ride.ratings[0].rating}</p>
                      {ride.ratings[0].comment && <p><strong>Your Review:</strong> {ride.ratings[0].comment}</p>}
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Rides;
