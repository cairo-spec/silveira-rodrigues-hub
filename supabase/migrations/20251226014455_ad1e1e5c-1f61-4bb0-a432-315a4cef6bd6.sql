-- Drop existing user update policy and replace with more specific one
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow users to update their basic profile info (always allowed)
CREATE POLICY "Users can update their own basic info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- When updating trial/access fields, only allow if user doesn't already have access
  AND (
    -- If not touching privileged fields, always allow
    (
      trial_active IS NOT DISTINCT FROM (SELECT trial_active FROM profiles WHERE user_id = auth.uid())
      AND trial_expires_at IS NOT DISTINCT FROM (SELECT trial_expires_at FROM profiles WHERE user_id = auth.uid())
      AND access_authorized IS NOT DISTINCT FROM (SELECT access_authorized FROM profiles WHERE user_id = auth.uid())
      AND subscription_active IS NOT DISTINCT FROM (SELECT subscription_active FROM profiles WHERE user_id = auth.uid())
    )
    -- OR if user currently has no access, allow activating trial
    OR (
      (SELECT subscription_active FROM profiles WHERE user_id = auth.uid()) IS NOT TRUE
      AND (SELECT trial_active FROM profiles WHERE user_id = auth.uid()) IS NOT TRUE
      AND (SELECT access_authorized FROM profiles WHERE user_id = auth.uid()) IS NOT TRUE
      -- Cannot set subscription_active (only webhook can do that)
      AND (subscription_active IS NOT DISTINCT FROM (SELECT subscription_active FROM profiles WHERE user_id = auth.uid()))
    )
  )
);