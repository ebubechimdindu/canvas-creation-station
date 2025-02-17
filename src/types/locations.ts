
export type LocationCategory = 'academic' | 'residence' | 'common_area' | 'administrative' | 'pickup_point' | 'dropoff_point' | 'campus_boundary';

export type LocationReferenceType = 'building' | 'intersection' | 'landmark' | 'gate' | 'path';

export interface LocationReference {
  id: string;
  name: string;
  referenceType: LocationReferenceType;
  description?: string;
  distance: number;
}

export interface CampusLocation {
  id: string;
  name: string;
  description?: string;
  locationType: LocationCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  isVerified: boolean;
  buildingCode?: string;
  commonNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationWithReferences {
  coordinates: {
    lat: number;
    lng: number;
  };
  nearbyReferences: LocationReference[];
  address?: string;
}

export interface LocationFeedback {
  id: string;
  locationId: string;
  feedbackType: string;
  description?: string;
  suggestedCoordinates?: {
    lat: number;
    lng: number;
  };
  submittedBy: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  createdAt: string;
}

