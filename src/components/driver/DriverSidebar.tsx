import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Car, Clock, Settings, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebarState } from "@/hooks/useSidebarState";

const DriverSidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarState();
  
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
    // {
    //   name: "Earnings",
    //   href: "/driver/earnings",
    //   icon: DollarSign,
    // },
    {
      name: "Settings",
      href: "/driver/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn(
      "relative h-screen border-r bg-background py-4 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 hidden md:flex"
        onClick={toggleSidebar}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <div className="flex h-full flex-col justify-between px-3">
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
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default DriverSidebar;
