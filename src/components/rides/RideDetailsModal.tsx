
import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RideMap from "../map/RideMap";
import { RideTimeline } from "./RideTimeline";
import { RideStatusBadge } from "./RideStatusBadge";
import { MapPin, Calendar, Clock, User, MessageSquare, Upload, Phone, CreditCard } from "lucide-react";
import { Ride } from "@/types";
import { format } from "date-fns";
import { useCampusLocations } from "@/hooks/use-campus-locations";
import { useAppSelector } from "@/hooks/redux";

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
  const { locations, isLoading: isLoadingLocations } = useCampusLocations();
  const userRole = useAppSelector(state => state.auth.user?.role);

  // Group locations by type
  const groupedLocations = locations.reduce((acc, location) => {
    const type = location.locationType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(location);
    return acc;
  }, {} as Record<string, typeof locations>);

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

  const formatLocationType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPhoneNumberUrl = (phone: string) => {
    return `tel:${phone.replace(/\D/g, '')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ride Details #{ride.id}</span>
            <RideStatusBadge status={ride.status} animated />
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <TabsContent value="details" className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Route Information</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Pickup Location</span>
                        </div>
                        <Select defaultValue={ride.pickup}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select pickup location" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(groupedLocations).map(([type, locs]) => (
                              <SelectGroup key={type}>
                                <SelectLabel>{formatLocationType(type)}</SelectLabel>
                                {locs.map((loc) => (
                                  <SelectItem 
                                    key={loc.id} 
                                    value={loc.name}
                                    className="flex items-center gap-2"
                                  >
                                    <span>{loc.name}</span>
                                    {loc.buildingCode && (
                                      <span className="text-xs text-muted-foreground">
                                        ({loc.buildingCode})
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Dropoff Location</span>
                        </div>
                        <Select defaultValue={ride.dropoff}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select dropoff location" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(groupedLocations).map(([type, locs]) => (
                              <SelectGroup key={type}>
                                <SelectLabel>{formatLocationType(type)}</SelectLabel>
                                {locs.map((loc) => (
                                  <SelectItem 
                                    key={loc.id} 
                                    value={loc.name}
                                    className="flex items-center gap-2"
                                  >
                                    <span>{loc.name}</span>
                                    {loc.buildingCode && (
                                      <span className="text-xs text-muted-foreground">
                                        ({loc.buildingCode})
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
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

                  {ride.notes && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Notes</h3>
                      <p className="text-sm text-gray-600 bg-muted p-3 rounded-md">{ride.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-semibold">Student Information</h3>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Student Name (ID: {ride.student_id})</span>
                    </div>
                  </div>

                  {ride.driverDetails && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Driver Information</h3>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Avatar className="h-10 w-10">
                          {ride.driverDetails.profilePictureUrl ? (
                            <AvatarImage src={ride.driverDetails.profilePictureUrl} alt={ride.driverDetails.name} />
                          ) : (
                            <AvatarFallback>{ride.driverDetails.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{ride.driverDetails.name}</p>
                          <a 
                            href={formatPhoneNumberUrl(ride.driverDetails.phoneNumber)}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {ride.driverDetails.phoneNumber}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="map" className="h-[500px]">
                <RideMap
                  pickup={ride.pickup}
                  dropoff={ride.dropoff}
                  className="w-full h-full"
                  onRouteCalculated={handleRouteCalculated}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <RideTimeline ride={ride} />
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                {userRole === 'student' && ride.driverDetails && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Driver Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-16 w-16">
                          {ride.driverDetails.profilePictureUrl ? (
                            <AvatarImage src={ride.driverDetails.profilePictureUrl} alt={ride.driverDetails.name} />
                          ) : (
                            <AvatarFallback>{ride.driverDetails.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-lg">{ride.driverDetails.name}</h4>
                          <a 
                            href={formatPhoneNumberUrl(ride.driverDetails.phoneNumber)}
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{ride.driverDetails.phoneNumber}</span>
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Details
                        </h4>
                        <div className="space-y-1 pl-6 bg-muted p-3 rounded-md">
                          <p><span className="font-medium">Bank:</span> {ride.driverDetails.accountDetails.bankName}</p>
                          <p><span className="font-medium">Account Name:</span> {ride.driverDetails.accountDetails.accountName}</p>
                          <p><span className="font-medium">Account Number:</span> {ride.driverDetails.accountDetails.accountNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {userRole === 'driver' && ride.studentDetails && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Student Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{ride.studentDetails.name}</span>
                      </div>
                      <a 
                        href={formatPhoneNumberUrl(ride.studentDetails.phoneNumber)}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{ride.studentDetails.phoneNumber}</span>
                      </a>
                    </div>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RideDetailsModal;
