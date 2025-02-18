
import { createClient } from '@supabase/supabase-js';
import { type Database } from '../types/supabase';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

// Add custom function types
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc<R>(
      fn: 'set_primary_bank_account',
      args: { p_account_id: string; p_driver_id: string }
    ): Promise<{ data: R; error: null } | { data: null; error: Error }>;
  }
}
