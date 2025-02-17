
import { Card, CardContent } from "@/components/ui/card";
import { LocationReference } from "@/types/locations";
import { Building2, Navigation, Landmark, Gate, GitFork } from "lucide-react";

interface LocationInfoCardProps {
  references: LocationReference[];
  className?: string;
}

const ReferenceIcon = ({ type }: { type: LocationReference['referenceType'] }) => {
  switch (type) {
    case 'building':
      return <Building2 className="h-4 w-4" />;
    case 'intersection':
      return <GitFork className="h-4 w-4" />;
    case 'landmark':
      return <Landmark className="h-4 w-4" />;
    case 'gate':
      return <Gate className="h-4 w-4" />;
    case 'path':
      return <Navigation className="h-4 w-4" />;
  }
};

export const LocationInfoCard = ({ references, className = "" }: LocationInfoCardProps) => {
  if (references.length === 0) return null;

  return (
    <Card className={`w-full max-w-sm bg-white/90 backdrop-blur-sm ${className}`}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2">Nearby Locations</h3>
        <ul className="space-y-2">
          {references.map((ref) => (
            <li key={ref.id} className="flex items-center gap-2 text-sm">
              <ReferenceIcon type={ref.referenceType} />
              <span>{ref.name}</span>
              <span className="text-muted-foreground ml-auto">{ref.distance}m</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

