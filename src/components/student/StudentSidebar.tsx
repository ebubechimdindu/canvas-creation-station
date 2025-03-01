import { Home, MapPin, Settings, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/useSidebarState";

const menuItems = [
  { title: "Home", icon: Home, url: "/student/dashboard" },
  { title: "Rides", icon: MapPin, url: "/student/rides" },
  { title: "Settings", icon: Settings, url: "/student/settings" },
];

export function StudentSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebarState();

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

      <div className="flex h-full flex-col px-3">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="w-full justify-start gap-3"
              asChild
            >
              <a href={item.url}>
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.title}</span>}
              </a>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
