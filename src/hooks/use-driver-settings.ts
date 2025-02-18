
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DriverSettings {
  id: string;
  name: string;
  phone: string;
  driverLicenseNumber: string;
  profileImage?: {
    url: string;
    lastUpdated: string;
  };
  status: 'pending_verification' | 'verified' | 'suspended';
}

export const useDriverSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['driverSettings'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        id: user.id,
        name: profile.full_name,
        phone: profile.phone_number,
        driverLicenseNumber: profile.driver_license_number,
        status: profile.status,
        profileImage: profile.profile_picture_url ? {
          url: profile.profile_picture_url,
          lastUpdated: profile.updated_at
        } : undefined,
      } as DriverSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<DriverSettings>) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Update profile data
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .update({
          full_name: newSettings.name,
          phone_number: newSettings.phone,
          driver_license_number: newSettings.driverLicenseNumber,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverSettings'] });
      toast({
        title: "Settings Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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

      // First, try to get the existing file path to remove it
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single();

      // If there's an existing file, remove it
      if (profile?.profile_picture_url) {
        const oldFileName = profile.profile_picture_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('driver-profiles')
            .remove([oldFileName]);
        }
      }

      // Upload new file with proper path structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('driver-profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-profiles')
        .getPublicUrl(fileName);

      // Update the profile with the new URL
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverSettings'] });
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
