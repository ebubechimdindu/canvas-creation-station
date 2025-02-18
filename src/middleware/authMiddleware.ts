
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { supabase } from '@/lib/supabase';
import { logout, syncUser } from '../features/auth/authSlice';

export const authMiddleware: Middleware = (store) => (next) => async (action) => {
  const result = next(action);
  const state = store.getState() as RootState;

  // Handle auth-related actions
  if (action.type.startsWith('auth/')) {
    console.log('Auth action:', action.type, {
      authenticated: state.auth.isAuthenticated,
      status: state.auth.status,
      lastSync: state.auth.lastSync
    });

    // Check session expiry
    if (state.auth.sessionExpiry && new Date(state.auth.sessionExpiry) < new Date()) {
      store.dispatch(logout());
      return result;
    }

    // Handle user session restoration
    if (action.type === 'persist/REHYDRATE' && state.auth.isAuthenticated) {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        store.dispatch(logout());
        return result;
      }

      // Sync user data if needed
      if (session.user.id === state.auth.user?.id) {
        store.dispatch(syncUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name,
          role: state.auth.user.role
        }));
      }
    }

    // Set up real-time subscriptions when user logs in
    if (action.type === 'auth/login' && state.auth.user?.id) {
      const channel = supabase
        .channel(`user_${state.auth.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests',
            filter: `student_id=eq.${state.auth.user.id}`
          },
          (payload) => {
            // Handle real-time updates here
            console.log('Real-time update:', payload);
          }
        )
        .subscribe();

      // Store channel reference for cleanup
      (window as any).__supabaseChannel = channel;
    }

    // Clean up subscriptions on logout
    if (action.type === 'auth/logout') {
      if ((window as any).__supabaseChannel) {
        supabase.removeChannel((window as any).__supabaseChannel);
        delete (window as any).__supabaseChannel;
      }
    }
  }

  return result;
};
