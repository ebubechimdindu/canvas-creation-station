
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import RideMap from "../map/RideMap";
import { RideTimeline } from "./RideTimeline";
import { RideStatusBadge } from "./RideStatusBadge";
import { MapPin, Calendar, Clock, User, MessageSquare, Upload } from "lucide-react";
import { Ride } from "@/types";
import { format } from "date-fns";

interface RideDetailsModalProps {
  ride: Ride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RideDetailsModal = ({ ride, open, onOpenChange }: RideDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [note, setNote] = useState("");

  if (!ride) return null;

  const handleRouteCalculated = (distance: number, duration: number) => {
    setDistance(distance);
    setDuration(duration);
  };

  const handleAddNote = () => {
    if (note.trim()) {
      // Here you would typically dispatch an action to add the note
      setNote("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ride Details #{ride.id}</span>
            <RideStatusBadge status={ride.status} animated />
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="details" className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Route Information</h3>
                  <div className="grid gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Pickup Location</p>
                        <p className="text-muted-foreground">{ride.pickup}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Dropoff Location</p>
                        <p className="text-muted-foreground">{ride.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Time Information</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(ride.date), "PP")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(ride.date), "p")}</span>
                    </div>
                  </div>
                </div>

                {(distance > 0 && duration > 0) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Route Details</h3>
                    <div className="grid gap-2">
                      <p>Estimated Distance: {distance.toFixed(1)} km</p>
                      <p>Estimated Duration: {Math.round(duration)} minutes</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold">Student Information</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Student Name (ID: {ride.id})</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map">
              <RideMap
                pickup={ride.pickup}
                dropoff={ride.dropoff}
                className="h-[400px]"
                onRouteCalculated={handleRouteCalculated}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <RideTimeline ride={ride} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Textarea
                    placeholder="Add a note about this ride..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                {ride.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Notes</h3>
                    <p className="text-muted-foreground">{ride.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Upload Evidence</h3>
                  <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or click to select files
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RideDetailsModal;
