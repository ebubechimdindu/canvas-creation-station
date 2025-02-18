
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useStudentSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['studentSettings'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get settings data
      const { data: settings, error: settingsError } = await supabase
        .from('student_settings')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (settingsError) throw settingsError;

      return {
        id: user.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone_number,
        studentId: profile.student_id,
        profileImage: profile.profile_picture_url ? {
          url: profile.profile_picture_url,
          lastUpdated: settings.updated_at
        } : undefined,
        preferredPaymentType: settings.preferred_payment_type,
        notifications: settings.notifications_config,
        defaultLocations: settings.default_locations,
        theme: settings.theme_preference,
        language: settings.language_preference,
      } as StudentSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<StudentSettings>) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Update profile data
      if (newSettings.name || newSettings.phone) {
        const { error: profileError } = await supabase
          .from('student_profiles')
          .update({
            full_name: newSettings.name,
            phone_number: newSettings.phone,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update settings data
      const { error: settingsError } = await supabase
        .from('student_settings')
        .update({
          preferred_payment_type: newSettings.preferredPaymentType,
          notifications_config: newSettings.notifications,
          default_locations: newSettings.defaultLocations,
          theme_preference: newSettings.theme,
          language_preference: newSettings.language,
        })
        .eq('student_id', user.id);

      if (settingsError) throw settingsError;

      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentSettings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      console.error('Settings update error:', error);
    },
  });

  const updateProfileImage = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}-${Date.now()}`;
      const { data, error: uploadError } = await supabase.storage
        .from('student-profiles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentSettings'] });
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile image. Please try again.",
        variant: "destructive",
      });
      console.error('Profile image update error:', error);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    updateProfileImage,
  };
};
