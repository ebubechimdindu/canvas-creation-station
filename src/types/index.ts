
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'driver';
  phoneNumber?: string;
}

export interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  distance: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  lastUpdated: string;
}

export const RIDE_STATUS_UI = {
  COMPLETED: 'Completed',
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  CANCELLED: 'Cancelled'
} as const;

export type RideStatusUI = typeof RIDE_STATUS_UI[keyof typeof RIDE_STATUS_UI];

export type RideStatus = 
  | 'requested'
  | 'finding_driver'
  | 'driver_assigned'
  | 'en_route_to_pickup'
  | 'arrived_at_pickup'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'timeout';

export const mapRideStatusToUI = (status: RideStatus): RideStatusUI => {
  switch (status) {
    case 'completed':
      return RIDE_STATUS_UI.COMPLETED;
    case 'requested':
    case 'finding_driver':
    case 'driver_assigned':
      return RIDE_STATUS_UI.UPCOMING;
    case 'en_route_to_pickup':
    case 'arrived_at_pickup':
    case 'in_progress':
      return RIDE_STATUS_UI.IN_PROGRESS;
    case 'cancelled':
    case 'timeout':
      return RIDE_STATUS_UI.CANCELLED;
  }
};

export interface BankAccount {
  id: string;
  driver_id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface RideRequest {
  id: number;
  student_id: string;
  driver_id?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_address: string;
  dropoff_address: string;
  status: RideStatus;
  notes?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
  matched_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  driver?: DriverProfile;
  driver_bank_accounts?: BankAccount[];
  ratings?: RideRating[];
  payment?: {
    method: 'cash' | 'transfer';
    status: 'pending' | 'paid';
    amount: number;
  };
  date?: string;
  pickup?: string;
  dropoff?: string;
}

export interface DriverProfile {
  id: string;
  full_name: string;
  phone_number: string;
  profile_picture_url?: string;
  status: 'verified' | 'suspended';
}

export interface RideRating {
  id: number;
  ride_id: number;
  rated_by: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Ride {
  id: number;
  student_id: string;
  driver_id?: string;
  date: string;
  pickup: string;
  dropoff: string;
  driver: string;
  status: RideStatusUI;
  rating?: number;
  payment: {
    method: 'cash' | 'transfer';
    status: 'pending' | 'paid';
    amount: number;
    confirmedBy?: string;
    confirmedAt?: string;
  };
  notes?: string;
  eta?: {
    minutes: number;
    distance: number;
    lastUpdated: string;
  };
  route?: {
    coordinates: [number, number][];
    duration: number;
    distance: number;
  };
  studentDetails?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  driverDetails?: {
    id: string;
    name: string;
    phoneNumber: string;
    profilePictureUrl?: string;
    accountDetails: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  };
}

export interface StudentSettings {
  id: string;
  name: string | null;
  email?: string;
  phone?: string;
  studentId?: string;
  profileImage?: {
    url: string;
    lastUpdated: string;
  };
  preferredPaymentType: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  defaultLocations: {
    home: string | null;
    school: string | null;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ig' | 'yo' | 'ha';
}
