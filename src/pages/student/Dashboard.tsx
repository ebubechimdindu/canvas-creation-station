
import React from 'react';
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentDashboard } from "@/hooks/use-student-dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapProvider } from "@/components/map/MapProvider";
import { Star, Navigation, MapPin } from "lucide-react";
import { useLocationUpdates } from "@/hooks/use-location-updates";

const Dashboard = () => {
  const { stats, recentActivity, isLoading } = useStudentDashboard();
  const { nearbyDrivers } = useLocationUpdates('all-drivers');

  const onlineDrivers = nearbyDrivers.filter(driver => driver.status === 'available');

  return (
    <MapProvider>
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_rides || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.today_rides || 0} rides today
                  </p>
                </CardContent>
              </Card>
              {/* Add other stat cards */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Available Drivers Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Available Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {onlineDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={driver.profilePictureUrl || undefined} />
                            <AvatarFallback>{driver.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{driver.name}</h3>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm text-muted-foreground">
                                {driver.rating.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(driver.distance)}km away
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {onlineDrivers.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No drivers available at the moment
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex flex-col space-y-2 p-4 bg-muted rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.driver_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{activity.pickup_address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </MapProvider>
  );
};

export default Dashboard;
