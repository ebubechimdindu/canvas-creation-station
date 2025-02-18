
-- Set driver_profiles.status to default to 'verified'
ALTER TABLE public.driver_profiles 
ALTER COLUMN status SET DEFAULT 'verified';

-- Update any existing unverified drivers to verified status
UPDATE public.driver_profiles 
SET status = 'verified' 
WHERE status = 'pending_verification';

