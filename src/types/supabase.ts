
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
          status: 'pending_verification' | 'verified' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          driver_license_number: string
          phone_number: string
          profile_picture_url?: string | null
          status?: 'pending_verification' | 'verified' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          driver_license_number?: string
          phone_number?: string
          profile_picture_url?: string | null
          status?: 'pending_verification' | 'verified' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
