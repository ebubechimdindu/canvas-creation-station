
import { useState, useEffect } from 'react';
import { Driver } from '@/types';

export const useLocationUpdates = (driverId?: string) => {
  const [driverLocation, setDriverLocation] = useState<Driver['currentLocation']>();
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    // Simulate real-time location updates
    const updateInterval = setInterval(() => {
      // Simulate driver movement
      setDriverLocation(prev => {
        if (!prev) return {
          lat: 6.4552,
          lng: 3.4470,
          heading: 0,
          speed: 30,
          timestamp: new Date().toISOString()
        };

        return {
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
          heading: Math.random() * 360,
          speed: 30 + Math.random() * 10,
          timestamp: new Date().toISOString()
        };
      });

      // Simulate nearby drivers
      setNearbyDrivers(Array.from({ length: 5 }, (_, i) => ({
        id: `driver-${i}`,
        name: `Driver ${i + 1}`,
        rating: 4 + Math.random(),
        distance: Math.random() * 5,
        status: Math.random() > 0.3 ? 'available' : 'busy',
        accountDetails: {
          bankName: 'Sample Bank',
          accountNumber: '1234567890',
          accountName: `Driver ${i + 1}`
        },
        currentLocation: {
          lat: 6.4552 + (Math.random() - 0.5) * 0.02,
          lng: 3.4470 + (Math.random() - 0.5) * 0.02,
          heading: Math.random() * 360,
          speed: 30 + Math.random() * 10,
          timestamp: new Date().toISOString()
        }
      })));
    }, 2000);

    return () => clearInterval(updateInterval);
  }, [driverId]);

  return { driverLocation, nearbyDrivers };
};

