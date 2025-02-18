
import { cn } from "@/lib/utils";
import { type RideStatus, type RideStatusUI, RIDE_STATUS_UI, mapRideStatusToUI } from "@/types";

interface RideStatusBadgeProps {
  status: RideStatus | RideStatusUI;
  animated?: boolean;
}

export function RideStatusBadge({ status, animated = false }: RideStatusBadgeProps) {
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const uiStatus = Object.values(RIDE_STATUS_UI).includes(status as RideStatusUI) 
    ? status as RideStatusUI 
    : mapRideStatusToUI(status as RideStatus);
  
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  const statusClasses = {
    [RIDE_STATUS_UI.COMPLETED]: 'bg-green-100 text-green-800',
    [RIDE_STATUS_UI.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [RIDE_STATUS_UI.UPCOMING]: 'bg-yellow-100 text-yellow-800',
    [RIDE_STATUS_UI.CANCELLED]: 'bg-red-100 text-red-800',
  };

  const animationClasses = animated ? "transition-all duration-300 animate-fade-in" : "";

  return (
    <span className={cn(
      baseClasses,
      statusClasses[uiStatus],
      animationClasses
    )}>
      {displayStatus}
    </span>
  );
}
