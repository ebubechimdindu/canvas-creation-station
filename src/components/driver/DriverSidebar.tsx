
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Car, Clock, Settings, DollarSign, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useState, useEffect } from "react";

const DriverSidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // If we're on mobile, render a different version
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Mobile menu */}
        <div className={cn(
          "fixed inset-0 z-40 bg-background/95 backdrop-blur-sm transform transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6 pt-16">
            <nav className="space-y-4">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-lg py-3",
                      location.pathname === item.href && "bg-secondary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto">
              <p className="text-sm text-muted-foreground text-center pb-6">
                &copy; {new Date().getFullYear()} School Ride
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop version
  return (
    <div className={cn(
      "relative h-screen border-r bg-background py-4 transition-all duration-300 hidden md:block",
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
