
import { useToast } from '../use-toast';
import { supabase } from '../../lib/supabase';

export const useVerificationEmail = () => {
  const { toast } = useToast();

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

  return { resendVerificationEmail };
};
