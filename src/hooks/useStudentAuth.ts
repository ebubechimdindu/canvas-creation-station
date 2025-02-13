
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { useAppDispatch } from './redux';
import { login, setError } from '../features/auth/authSlice';

export const useStudentAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error) {
      console.error('Error resending verification:', error);
      toast({
        title: "Failed to Resend",
        description: "Could not resend verification email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const registerStudent = async ({
    email,
    password,
    fullName,
    studentId,
    phone,
    department,
    level,
    profilePicture
  }: {
    email: string;
    password: string;
    fullName: string;
    studentId: string;
    phone: string;
    department: string;
    level: string;
    profilePicture: File | null;
  }) => {
    try {
      setIsLoading(true);

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: fullName,
            student_id: studentId,
            phone_number: phone,
          }
        }
      });

      if (authError || !authData.user) throw authError || new Error('Registration failed');

      let profilePictureUrl = null;

      // 2. Upload profile picture if provided
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const filePath = `${authData.user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('student-profiles')
          .upload(filePath, profilePicture);

        if (uploadError) throw uploadError;
        profilePictureUrl = filePath;
      }

      // 3. Create student profile
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          student_id: studentId,
          phone_number: phone,
          department,
          level,
          profile_picture_url: profilePictureUrl,
          email: email, // Add email to the profile
        });

      if (profileError) throw profileError;

      // 4. Update Redux store
      dispatch(login({
        id: authData.user.id,
        email: authData.user.email!,
        name: fullName,
        role: 'student'
      }));

      toast({
        title: "Registration Successful",
        description: "Welcome to Campus Rides!",
      });

      navigate('/student/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = (error as Error).message || 'Registration failed';
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

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
    registerStudent,
    loginStudent,
    isLoading,
    resendVerificationEmail,
  };
};
