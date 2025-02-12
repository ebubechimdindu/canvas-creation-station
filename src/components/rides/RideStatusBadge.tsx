
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";

interface RideStatusBadgeProps {
  status: Ride['status'];
  animated?: boolean;
}

export function RideStatusBadge({ status, animated = false }: RideStatusBadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  const statusClasses = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Upcoming': 'bg-yellow-100 text-yellow-800',
    'Cancelled': 'bg-red-100 text-red-800',
  };

  const animationClasses = animated ? "transition-all duration-300 animate-fade-in" : "";

  return (
    <span className={cn(
      baseClasses,
      statusClasses[status],
      animationClasses
    )}>
      {status}
    </span>
  );
}
