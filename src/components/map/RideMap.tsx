
import React from 'react';
import MapboxLocationManager from '@/components/locations/MapboxLocationManager';

interface RideMapProps {
  pickup: string;
  dropoff: string;
  className?: string;
  showRoutePath?: boolean;
  mode?: 'student' | 'driver';
  nearbyDrivers?: Array<{ lat: number; lng: number }>;
  onRouteCalculated?: (distance: number, duration: number) => void;
  showNearbyRequests?: boolean;
}

const RideMap: React.FC<RideMapProps> = ({
  pickup,
  dropoff,
  className,
  showRoutePath,
  mode,
  nearbyDrivers,
  onRouteCalculated,
  showNearbyRequests
}) => {
  return (
    <MapboxLocationManager
      className={className}
      initialView={{
        pickup,
        dropoff
      }}
      showRoutePath={showRoutePath}
      mode={mode}
      nearbyDrivers={nearbyDrivers}
      onRouteCalculated={onRouteCalculated}
      showNearbyRequests={showNearbyRequests}
    />
  );
};

export default RideMap;
