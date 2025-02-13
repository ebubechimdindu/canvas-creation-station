
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { useAppDispatch } from './redux';
import { login, setError } from '../features/auth/authSlice';

export const useSupabaseAuth = () => {
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

  const registerDriver = async ({
    email,
    password,
    fullName,
    driverId,
    phone,
    profilePicture
  }: {
    email: string;
    password: string;
    fullName: string;
    driverId: string;
    phone: string;
    profilePicture: File;
  }) => {
    try {
      setIsLoading(true);

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          data: {
            full_name: fullName,
            driver_license_number: driverId,
            phone_number: phone,
          }
        }
      });

      if (authError || !authData.user) throw authError || new Error('Registration failed');

      // 2. Sign in immediately to get a valid session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // 3. Upload profile picture
      const fileExt = profilePicture.name.split('.').pop();
      const filePath = `${authData.user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-profiles')
        .upload(filePath, profilePicture);

      if (uploadError) throw uploadError;

      // 4. Create driver profile with the user's ID
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          driver_license_number: driverId,
          phone_number: phone,
          profile_picture_url: filePath,
          status: 'pending_verification'
        });

      if (profileError) throw profileError;

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });

      navigate('/auth/verify');

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

  const loginDriver = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // 1. Sign in with Supabase Auth
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check for email confirmation error
        if (signInError.message.includes('Email not confirmed')) {
          await resendVerificationEmail(email);
          navigate('/auth/verify');
          return;
        }
        throw signInError;
      }

      if (!user) throw new Error('Login failed');

      // 2. Fetch driver profile using maybeSingle() instead of single()
      const { data: profile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Check if profile exists
      if (!profile) {
        toast({
          title: "Profile Not Found",
          description: "No driver profile found. Please contact support.",
          variant: "destructive",
        });
        throw new Error('Driver profile not found');
      }

      // 3. Update Redux store
      dispatch(login({
        id: user.id,
        email: user.email!,
        name: profile.full_name,
        role: 'driver'
      }));

      // 4. Success notification and redirect
      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.full_name}!`,
      });

      navigate('/driver/dashboard');

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
    registerDriver,
    loginDriver,
    isLoading,
    resendVerificationEmail,
  };
};
