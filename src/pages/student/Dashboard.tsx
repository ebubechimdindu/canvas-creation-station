
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { MapPin, Calendar, Clock, Activity } from "lucide-react";

const StudentDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Button className={navigationMenuTriggerStyle()}>Book a Ride</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <QuickStat
                title="Active Rides"
                value="2"
                icon={<Activity className="h-6 w-6" />}
                trend="+5% from last week"
              />
              <QuickStat
                title="Total Rides"
                value="24"
                icon={<MapPin className="h-6 w-6" />}
                trend="+12% from last month"
              />
              <QuickStat
                title="This Month"
                value="8"
                icon={<Calendar className="h-6 w-6" />}
                trend="-2% from last month"
              />
              <QuickStat
                title="Avg. Wait Time"
                value="5min"
                icon={<Clock className="h-6 w-6" />}
                trend="Same as last week"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Recent Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((ride) => (
                      <div
                        key={ride}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                      >
                        <div>
                          <p className="font-medium">Campus Library → Dorm B</p>
                          <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Available Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((driver) => (
                      <div
                        key={driver}
                        className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <p className="font-medium">Driver {driver}</p>
                          <p className="text-sm text-gray-500">
                            4.8 ★ • 3 min away
                          </p>
                        </div>
                        <Button size="sm">Request</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

const QuickStat = ({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) => (
  <Card className="animate-fade-in">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{trend}</div>
    </CardContent>
  </Card>
);

export default StudentDashboard;
