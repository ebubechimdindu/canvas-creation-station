
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store, persistor } from './store';
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
import DriverDashboard from "./pages/driver/Dashboard";
import DriverRides from "./pages/driver/Rides";
import DriverSettings from "./pages/driver/Settings";
import DriverEarnings from "./pages/driver/Earnings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Set up QueryClient persistence
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
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
                  <Route path="/driver/dashboard" element={<DriverDashboard />} />
                  <Route path="/driver/rides" element={<DriverRides />} />
                  <Route path="/driver/settings" element={<DriverSettings />} />
                  <Route path="/driver/earnings" element={<DriverEarnings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
