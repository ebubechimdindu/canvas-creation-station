
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User } from 'lucide-react';
import type { RideRequest } from '@/types';

interface RideRequestCardProps {
  request: RideRequest;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onDecline
}) => {
  const notes = request.notes?.split('\n');
  const studentName = notes?.find(note => note.startsWith('Student:'))?.replace('Student:', '')?.trim();
  const phoneNumber = notes?.find(note => note.startsWith('Phone:'))?.replace('Phone:', '')?.trim();

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
        </div>
      </CardContent>
    </Card>
  );
};
