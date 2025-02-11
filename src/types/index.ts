
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
}

export interface Ride {
  id: number;
  date: string;
  pickup: string;
  dropoff: string;
  driver: string;
  status: 'Completed' | 'Upcoming' | 'Cancelled' | 'In Progress';
  rating?: number;
}
