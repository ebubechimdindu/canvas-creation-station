
import React from 'react';
import MapboxLocationManager from '@/components/locations/MapboxLocationManager';
import { type CampusLocation } from '@/types/locations';

interface RideMapProps {
  pickup: string;
  dropoff: string;
  className?: string;
  showRoutePath?: boolean;
  mode?: 'student' | 'driver';
  nearbyDrivers?: Array<{ lat: number; lng: number }>;
  onRouteCalculated?: (distance: number, duration: number) => void;
  showNearbyRequests?: boolean;
  onLocationSelect?: (location: CampusLocation) => void;
}

const RideMap: React.FC<RideMapProps> = ({
  pickup,
  dropoff,
  className,
  showRoutePath,
  mode,
  nearbyDrivers,
  onRouteCalculated,
  showNearbyRequests,
  onLocationSelect
}) => {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px]">
      <MapboxLocationManager
        className={`w-full h-full ${className}`}
        initialView={mode === 'driver' ? undefined : {
          pickup,
          dropoff
        }}
        showRoutePath={showRoutePath}
        mode={mode}
        nearbyDrivers={nearbyDrivers}
        onRouteCalculated={onRouteCalculated}
        showNearbyRequests={showNearbyRequests}
        onLocationSelect={onLocationSelect}
      />
    </div>
  );
};

export default RideMap;
