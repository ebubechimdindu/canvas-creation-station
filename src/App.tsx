
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLogin from "./pages/auth/StudentLogin";
import StudentRegister from "./pages/auth/StudentRegister";
import DriverLogin from "./pages/auth/DriverLogin";
import DriverRegister from "./pages/auth/DriverRegister";
import StudentDashboard from "./pages/student/Dashboard";
import StudentRides from "./pages/student/Rides";
import StudentSettings from "./pages/student/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
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
                <Route path="/student/settings" element={<StudentSettings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
