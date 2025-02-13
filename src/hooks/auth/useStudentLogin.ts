
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../use-toast';
import { useAppDispatch } from '../redux';
import { login, setError } from '../../features/auth/authSlice';
import { useVerificationEmail } from './useVerificationEmail';

export const useStudentLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { resendVerificationEmail } = useVerificationEmail();

  const loginStudent = async (studentId: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with student ID:', studentId);

      // 1. Get user profile by student ID to get the email
      const { data: studentProfile, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error('Student ID not found. Please check your ID and try again.');
      }

      if (!studentProfile) {
        throw new Error('Student profile not found');
      }

      console.log('Found student profile:', studentProfile);

      // 2. Sign in with email and password
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: studentProfile.email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Email not confirmed')) {
          await resendVerificationEmail(studentProfile.email);
          navigate('/auth/verify');
          return;
        }
        throw signInError;
      }

      if (!user) throw new Error('Login failed');

      // 3. Update Redux store
      dispatch(login({
        id: user.id,
        email: user.email!,
        name: studentProfile.full_name,
        role: 'student'
      }));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${studentProfile.full_name}!`,
      });

      navigate('/student/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = (error as Error).message || 'Login failed';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginStudent,
    isLoading,
  };
};
