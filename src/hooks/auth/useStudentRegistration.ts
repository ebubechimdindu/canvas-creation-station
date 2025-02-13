
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../use-toast';
import { useAppDispatch } from '../redux';
import { login, setError } from '../../features/auth/authSlice';

export const useStudentRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

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
          email: email,
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

  return {
    registerStudent,
    isLoading,
  };
};
