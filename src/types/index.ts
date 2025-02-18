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
  rating: number;
  distance: number;
  status: 'available' | 'busy' | 'offline';
  phoneNumber: string;
  accountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    timestamp: string;
  };
}

export type RideStatusUI = 'Completed' | 'Upcoming' | 'In Progress' | 'Cancelled';

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
      return 'Completed';
    case 'requested':
    case 'finding_driver':
    case 'driver_assigned':
      return 'Upcoming';
    case 'en_route_to_pickup':
    case 'arrived_at_pickup':
    case 'in_progress':
      return 'In Progress';
    case 'cancelled':
    case 'timeout':
      return 'Cancelled';
  }
};

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
  ratings?: RideRating[];
  payment?: {
    method: 'cash' | 'transfer';
    status: 'pending' | 'paid';
    amount: number;
  };
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
