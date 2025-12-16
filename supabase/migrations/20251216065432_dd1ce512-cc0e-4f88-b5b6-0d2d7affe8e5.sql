-- Fix: Prevent users from self-granting subscription/trial/access during profile creation
-- Users can only insert profiles with privileged fields set to false

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (subscription_active IS NULL OR subscription_active = false)
    AND (access_authorized IS NULL OR access_authorized = false)
    AND (trial_active IS NULL OR trial_active = false)
  );