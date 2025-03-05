
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, Clock, User } from "lucide-react";
import { useState, useEffect } from "react";

export function StudentSidebar() {
  const location = useLocation();
  const { isOpen } = useSidebar();
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
      href: "/student/dashboard",
      icon: Car,
    },
    {
      name: "Rides",
      href: "/student/rides",
      icon: Clock,
    },
    {
      name: "Settings",
      href: "/student/settings",
      icon: User,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // If we're on mobile, render a different version
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button - improved visibility and positioning */}
        <Button
          variant="secondary"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 shadow-md bg-white/90 backdrop-blur dark:bg-gray-900/90 border"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Mobile menu with improved animations */}
        <div className={cn(
          "fixed inset-0 z-40 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6 pt-20 animate-fade-in">
            <div className="mb-8 flex items-center justify-center">
              <span className="text-xl font-semibold">School Ride</span>
            </div>
            <nav className="space-y-6">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant={location.pathname === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 text-lg py-5 h-auto"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto">
              <p className="text-sm text-muted-foreground text-center pb-6 pt-4">
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
    <div
      className={cn(
        "relative h-screen border-r bg-background transition-all duration-300 hidden md:block",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-10 flex h-6 items-center px-2">
          {isOpen ? (
            <span className="text-lg font-semibold">School Ride</span>
          ) : (
            <span className="text-lg font-semibold">SR</span>
          )}
        </div>
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location.pathname === item.href && "bg-muted"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {isOpen && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
