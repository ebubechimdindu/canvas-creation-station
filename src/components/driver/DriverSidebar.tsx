
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Car, Clock, Settings, DollarSign } from "lucide-react";

const DriverSidebar = () => {
  const location = useLocation();
  
  const navigation = [
    {
      name: "Dashboard",
      href: "/driver/dashboard",
      icon: Car,
    },
    {
      name: "Rides",
      href: "/driver/rides",
      icon: Clock,
    },
    {
      name: "Earnings",
      href: "/driver/earnings",
      icon: DollarSign,
    },
    {
      name: "Settings",
      href: "/driver/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="h-screen w-64 border-r bg-background px-3 py-4">
      <div className="flex h-full flex-col justify-between">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location.pathname === item.href && "bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default DriverSidebar;
