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

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
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

      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single();

      if (profile?.profile_picture_url) {
        const oldFileName = profile.profile_picture_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('driver-profiles')
            .remove([oldFileName]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('driver-profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-profiles')
        .getPublicUrl(fileName);

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

  const { data: bankAccounts } = useQuery({
    queryKey: ['driverBankAccounts'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('driver_bank_accounts')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(account => ({
        id: account.id,
        bankName: account.bank_name,
        accountNumber: account.account_number,
        accountHolderName: account.account_holder_name,
        isPrimary: account.is_primary,
      })) as BankAccount[];
    },
  });

  const addBankAccount = useMutation({
    mutationFn: async (data: Omit<BankAccount, 'id' | 'isPrimary'>) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('driver_bank_accounts')
        .insert({
          driver_id: user.id,
          bank_name: data.bankName,
          account_number: data.accountNumber,
          account_holder_name: data.accountHolderName,
          is_primary: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverBankAccounts'] });
      toast({
        title: "Bank Account Added",
        description: "Your bank account has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add bank account. Please try again.",
        variant: "destructive",
      });
      console.error('Bank account add error:', error);
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('driver_bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverBankAccounts'] });
      toast({
        title: "Bank Account Removed",
        description: "Your bank account has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove bank account. Please try again.",
        variant: "destructive",
      });
      console.error('Bank account delete error:', error);
    },
  });

  const setPrimaryAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('set_primary_bank_account', {
        p_account_id: accountId,
        p_driver_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverBankAccounts'] });
      toast({
        title: "Primary Account Updated",
        description: "Your primary bank account has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update primary account. Please try again.",
        variant: "destructive",
      });
      console.error('Primary account update error:', error);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    updateProfileImage,
    bankAccounts,
    addBankAccount,
    deleteBankAccount,
    setPrimaryAccount,
  };
};
