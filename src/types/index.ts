
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'driver';
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  distance: number;
  status: 'available' | 'busy' | 'offline';
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
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
    status: 'pending' | 'completed';
    amount: number;
  };
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'bank_account';
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

export interface StudentSettings {
  id: string;
  defaultPaymentMethod: PaymentMethod | null;
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
