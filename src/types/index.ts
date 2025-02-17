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

export interface Ride {
  id: number;
  date: string;
  pickup: string;
  dropoff: string;
  driver: string;
  status: 'Completed' | 'Upcoming' | 'Cancelled' | 'In Progress';
  rating?: number;
  payment?: {
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
  name?: string;
  profileImage?: {
    url: string;
    lastUpdated: string;
  };
  preferredPaymentType: 'cash' | 'transfer';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  defaultLocations: {
    home?: string;
    school?: string;
    other?: string[];
  };
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ig' | 'yo' | 'ha';
}
