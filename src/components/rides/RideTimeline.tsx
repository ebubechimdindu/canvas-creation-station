
import { CheckCircle, Clock, MapPin, XCircle } from "lucide-react";
import type { Ride } from "@/types";
import { format } from "date-fns";

interface RideTimelineProps {
  ride: Ride;
}

export function RideTimeline({ ride }: RideTimelineProps) {
  const timelineSteps = [
    {
      label: "Requested",
      icon: Clock,
      date: ride.date,
      completed: true,
    },
    {
      label: "Started",
      icon: MapPin,
      date: ride.status === 'In Progress' || ride.status === 'Completed' ? ride.date : null,
      completed: ride.status === 'In Progress' || ride.status === 'Completed',
    },
    {
      label: "Completed",
      icon: CheckCircle,
      date: ride.status === 'Completed' ? ride.date : null,
      completed: ride.status === 'Completed',
    },
  ];

  if (ride.status === 'Cancelled') {
    timelineSteps.push({
      label: "Cancelled",
      icon: XCircle,
      date: ride.date,
      completed: true,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Ride Timeline</h3>
      <div className="relative space-y-4">
        {timelineSteps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              step.completed ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <step.icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{step.label}</p>
              {step.date && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(step.date), "PPp")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
