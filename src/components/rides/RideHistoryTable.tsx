
import React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Star } from "lucide-react";
import { RideStatusBadge } from "./RideStatusBadge";
import { type RideRequest } from "@/types";
import { Loader2 } from "lucide-react";

interface RideHistoryTableProps {
  rides: RideRequest[];
  isLoading?: boolean;
}

export function RideHistoryTable({ rides, isLoading }: RideHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Pickup</TableHead>
          <TableHead>Dropoff</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rides.map((ride) => (
          <TableRow key={ride.id}>
            <TableCell>{format(new Date(ride.created_at), "MMM dd, yyyy")}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {ride.pickup_address}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {ride.dropoff_address}
              </div>
            </TableCell>
            <TableCell>{ride.driver?.full_name || "-"}</TableCell>
            <TableCell>
              <RideStatusBadge status={ride.status} />
            </TableCell>
            <TableCell>
              {ride.ratings && ride.ratings.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{ride.ratings[0].rating}</span>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
