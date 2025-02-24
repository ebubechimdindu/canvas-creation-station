
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      driver_profiles: {
        Row: {
          id: string
          full_name: string
          driver_license_number: string
          phone_number: string
          profile_picture_url: string | null
          status: 'verified' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          driver_license_number: string
          phone_number: string
          profile_picture_url?: string | null
          status?: 'verified' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          driver_license_number?: string
          phone_number?: string
          profile_picture_url?: string | null
          status?: 'verified' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      driver_bank_accounts: {
        Row: {
          id: string
          driver_id: string
          bank_name: string
          account_number: string
          account_holder_name: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          bank_name: string
          account_number: string
          account_holder_name: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          bank_name?: string
          account_number?: string
          account_holder_name?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ride_requests: {
        Row: {
          id: number
          student_id: string
          pickup_location: unknown
          dropoff_location: unknown
          pickup_address: string
          dropoff_address: string
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          special_requirements: string | null
          driver_id: string | null
          created_at: string
          updated_at: string
          student_confirmed_complete: boolean
          driver_confirmed_complete: boolean
          completion_confirmed_at: string | null
          last_location_update: string | null
        }
        Insert: {
          student_id: string
          pickup_location: unknown
          dropoff_location: unknown
          pickup_address: string
          dropoff_address: string
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          special_requirements?: string | null
          driver_id?: string | null
          created_at?: string
          updated_at?: string
          student_confirmed_complete?: boolean
          driver_confirmed_complete?: boolean
          completion_confirmed_at?: string | null
          last_location_update?: string | null
        }
        Update: {
          student_id?: string
          pickup_location?: unknown
          dropoff_location?: unknown
          pickup_address?: string
          dropoff_address?: string
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          special_requirements?: string | null
          driver_id?: string | null
          created_at?: string
          updated_at?: string
          student_confirmed_complete?: boolean
          driver_confirmed_complete?: boolean
          completion_confirmed_at?: string | null
          last_location_update?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_primary_bank_account: {
        Args: {
          p_account_id: string
          p_driver_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

