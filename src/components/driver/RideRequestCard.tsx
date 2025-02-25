
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Check, Navigation, Car } from 'lucide-react';
import type { RideRequest } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface RideRequestCardProps {
  request: RideRequest;
  onAccept?: (requestId: number) => void;
  onDecline?: (requestId: number) => void;
  onStatusUpdate?: (requestId: number, newStatus: 'arrived_at_pickup' | 'in_progress' | 'completed') => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  onStatusUpdate
}) => {
  const notes = request.notes?.split('\n');
  const studentName = notes?.find(note => note.startsWith('Student:'))?.replace('Student:', '')?.trim();
  const phoneNumber = notes?.find(note => note.startsWith('Phone:'))?.replace('Phone:', '')?.trim();

  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    switch (status) {
      case 'driver_assigned':
        variant = "secondary";
        break;
      case 'in_progress':
        variant = "default";
        break;
      case 'completed':
        variant = "outline";
        break;
      case 'cancelled':
        variant = "destructive";
        break;
    }

    return (
      <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>
    );
  };

  const renderStatusActions = () => {
    switch (request.status) {
      case 'requested':
      case 'finding_driver':
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDecline?.(request.id)}
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept?.(request.id)}
            >
              Accept
            </Button>
          </div>
        );

      case 'driver_assigned':
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              onClick={() => onStatusUpdate?.(request.id, 'arrived_at_pickup')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Arrived at Pickup
            </Button>
          </div>
        );

      case 'arrived_at_pickup':
        return (
          <div className="space-y-2">
            <Alert>
              <AlertTitle>Waiting for student confirmation</AlertTitle>
              <AlertDescription>
                The student has been notified of your arrival. Once they confirm, you can start the ride.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => onStatusUpdate?.(request.id, 'in_progress')}
                className="bg-green-500 hover:bg-green-600"
              >
                <Car className="w-4 h-4 mr-2" />
                Start Ride
              </Button>
            </div>
          </div>
        );

      case 'in_progress':
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              onClick={() => onStatusUpdate?.(request.id, 'completed')}
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete Ride
            </Button>
          </div>
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
              {renderStatusBadge(request.status)}
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

        <div className="mt-4">
          {renderStatusActions()}
        </div>
      </CardContent>
    </Card>
  );
};
