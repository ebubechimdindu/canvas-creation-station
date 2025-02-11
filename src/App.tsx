
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useContext, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLogin from "./pages/auth/StudentLogin";
import StudentRegister from "./pages/auth/StudentRegister";
import DriverLogin from "./pages/auth/DriverLogin";
import DriverRegister from "./pages/auth/DriverRegister";
import StudentDashboard from "./pages/student/Dashboard";
import StudentRides from "./pages/student/Rides";

// Session Context
export const SessionContext = createContext<{
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any) => void;
  logout: () => void;
}>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

// Ride Context
export const RideContext = createContext<{
  activeRide: any | null;
  rideHistory: any[];
  availableDrivers: any[];
  setActiveRide: (ride: any) => void;
  addToHistory: (ride: any) => void;
  updateDrivers: (drivers: any[]) => void;
}>({
  activeRide: null,
  rideHistory: [],
  availableDrivers: [],
  setActiveRide: () => {},
  addToHistory: () => {},
  updateDrivers: () => {},
});

const queryClient = new QueryClient();

const App = () => {
  // Session State
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ride State
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  // Session Methods
  const login = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Ride Methods
  const addToHistory = (ride: any) => {
    setRideHistory(prev => [...prev, ride]);
  };

  const updateDrivers = (drivers: any[]) => {
    setAvailableDrivers(drivers);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ isAuthenticated, user, login, logout }}>
        <RideContext.Provider 
          value={{
            activeRide,
            rideHistory,
            availableDrivers,
            setActiveRide,
            addToHistory,
            updateDrivers,
          }}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth/student/login" element={<StudentLogin />} />
                <Route path="/auth/student/register" element={<StudentRegister />} />
                <Route path="/auth/driver/login" element={<DriverLogin />} />
                <Route path="/auth/driver/register" element={<DriverRegister />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/rides" element={<StudentRides />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RideContext.Provider>
      </SessionContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
