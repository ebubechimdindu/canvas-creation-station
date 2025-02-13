
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const authMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  const state = store.getState();

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
