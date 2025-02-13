
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { login, logout, syncUser, setError } from '../features/auth/authSlice';
import { User } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, status, error, lastSync, sessionExpiry } = useAppSelector(
    (state) => state.auth
  );

  // Check session validity
  const checkSession = useCallback(() => {
    if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
      dispatch(logout());
      return false;
    }
    return true;
  }, [sessionExpiry, dispatch]);

  // Sync user data with localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedExpiry = localStorage.getItem('sessionExpiry');

    if (storedUser && storedExpiry) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (new Date(storedExpiry) > new Date()) {
          dispatch(login(parsedUser));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        console.error('Error parsing stored user:', err);
        dispatch(logout());
      }
    }
  }, [dispatch]);

  // Auto-sync interval (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncInterval = setInterval(() => {
      if (!checkSession()) return;

      // In Phase 2, this will sync with Supabase
      console.log('Auto-syncing user data...');
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, checkSession]);

  // Handle user updates
  const updateUser = useCallback((updates: Partial<User>) => {
    if (!checkSession()) return;
    dispatch(syncUser(updates));
  }, [dispatch, checkSession]);

  // Handle authentication errors
  const handleAuthError = useCallback((error: string) => {
    dispatch(setError(error));
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    status,
    error,
    lastSync,
    updateUser,
    handleAuthError,
    checkSession,
  };
};
