import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentDashboard } from '@/hooks/use-student-dashboard';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, Star } from 'lucide-react';
import RideStatusBadge from '@/components/rides/RideStatusBadge';
import { format } from 'date-fns';
import { useRideRequests } from '@/hooks/use-ride-requests';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, recentActivity, nearbyDrivers, isLoading } = useStudentDashboard();
  const { activeRide } = useRideRequests();

  const handleBookRide = () => {
    navigate('/student/rides', { state: { openRideRequest: true } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {activeRide && (
        <Alert>
          <AlertDescription>
            You have an active ride. Please complete or cancel it before requesting a new one.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_rides || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_rides || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthly_rides || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_wait_minutes || 0}m</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent rides</p>
              ) : (
                recentActivity?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {activity.pickup_address} → {activity.dropoff_address}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </div>
                        {activity.driver_name && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {activity.rating || 'Not rated'}
                          </div>
                        )}
                      </div>
                    </div>
                    <RideStatusBadge status={activity.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Available Drivers</CardTitle>
            <Button 
              onClick={handleBookRide}
              disabled={!!activeRide}
            >
              Book a Ride
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nearbyDrivers?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No drivers available</p>
              ) : (
                nearbyDrivers?.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{driver.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>{driver.average_rating.toFixed(1)}</span>
                        <Badge variant="secondary">
                          {(driver.distance_meters / 1000).toFixed(1)} km away
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
