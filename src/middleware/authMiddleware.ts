
import { Middleware, Action } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define a type for our actions
interface AuthAction extends Action {
  type: string;
  payload?: any;
}

export const authMiddleware: Middleware = (store) => (next) => (action: AuthAction) => {
  const result = next(action);
  const state = store.getState() as RootState;

  // Handle auth-related actions
  if (action.type.startsWith('auth/')) {
    // Log authentication events (useful for debugging)
    console.log('Auth action:', action.type, {
      authenticated: state.auth.isAuthenticated,
      status: state.auth.status,
      lastSync: state.auth.lastSync
    });

    // In Phase 2, this will sync with Supabase
    if (action.type === 'auth/login' || action.type === 'auth/syncUser') {
      console.log('Syncing user data with backend...');
    }
  }

  return result;
};
