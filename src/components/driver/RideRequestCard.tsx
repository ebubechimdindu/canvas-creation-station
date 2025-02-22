
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Navigation, Car, CheckCircle } from 'lucide-react';
import type { RideRequest } from '@/types';

interface RideRequestCardProps {
  request: RideRequest;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
  onStartNavigation?: (requestId: number) => void;
  onArriveAtPickup?: (requestId: number) => void;
  onStartRide?: (requestId: number) => void;
  onCompleteRide?: (requestId: number) => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  onStartNavigation,
  onArriveAtPickup,
  onStartRide,
  onCompleteRide
}) => {
  const notes = request.notes?.split('\n');
  const studentName = notes?.find(note => note.startsWith('Student:'))?.replace('Student:', '')?.trim();
  const phoneNumber = notes?.find(note => note.startsWith('Phone:'))?.replace('Phone:', '')?.trim();

  const renderActionButtons = () => {
    switch (request.status) {
      case 'requested':
      case 'finding_driver':
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDecline(request.id)}
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept(request.id)}
            >
              Accept
            </Button>
          </>
        );
      case 'driver_assigned':
        return (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onStartNavigation?.(request.id)}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Start Navigation
          </Button>
        );
      case 'en_route_to_pickup':
        return (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onArriveAtPickup?.(request.id)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Arrived at Pickup
          </Button>
        );
      case 'arrived_at_pickup':
        return (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onStartRide?.(request.id)}
          >
            <Car className="w-4 h-4 mr-2" />
            Start Ride
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onCompleteRide?.(request.id)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Ride
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{request.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(request.created_at).toLocaleTimeString()}
              </span>
            </div>
            
            {studentName && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                <span>{studentName}</span>
              </div>
            )}
            
            {phoneNumber && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{phoneNumber}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm">{request.pickup_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm">{request.dropoff_address}</span>
              </div>
            </div>

            {notes && notes.length > 0 && !notes[0].startsWith('Student:') && !notes[0].startsWith('Phone:') && (
              <div className="text-sm text-muted-foreground">
                {notes.filter(note => !note.startsWith('Student:') && !note.startsWith('Phone:')).join('\n')}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};
