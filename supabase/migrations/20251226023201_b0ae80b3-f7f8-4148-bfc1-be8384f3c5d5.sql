-- Fix Issue 1: Remove ability for users to self-grant trial access
-- Drop the current permissive policy that allows trial self-activation
DROP POLICY IF EXISTS "Users can update their own basic info" ON public.profiles;

-- Create a new restrictive policy that ONLY allows users to update non-privileged fields
-- Users can update: nome, telefone, empresa, avatar_url, contract_accepted, pricing_accepted, lgpd_accepted
-- Users CANNOT update: trial_active, trial_expires_at, access_authorized, subscription_active, client_organization_id
CREATE POLICY "Users can update their own basic info"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Ensure privileged fields are NOT being changed from their current values
  AND trial_active IS NOT DISTINCT FROM (SELECT trial_active FROM profiles WHERE user_id = auth.uid())
  AND trial_expires_at IS NOT DISTINCT FROM (SELECT trial_expires_at FROM profiles WHERE user_id = auth.uid())
  AND access_authorized IS NOT DISTINCT FROM (SELECT access_authorized FROM profiles WHERE user_id = auth.uid())
  AND subscription_active IS NOT DISTINCT FROM (SELECT subscription_active FROM profiles WHERE user_id = auth.uid())
  AND client_organization_id IS NOT DISTINCT FROM (SELECT client_organization_id FROM profiles WHERE user_id = auth.uid())
);

-- Fix Issue 2: Restrict audit-reports storage access to organization-based access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view audit reports" ON storage.objects;

-- Create organization-based access policy for audit reports
-- File paths should follow pattern: {organization_id}/{filename}
-- Using LIKE pattern matching instead of array syntax
CREATE POLICY "Users can view their organization audit reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audit-reports'
  AND (
    -- Admins can view all reports
    has_role(auth.uid(), 'admin')
    -- Users can only view reports for their organization (path starts with their org id)
    OR (
      name LIKE (
        SELECT p.client_organization_id::text || '/%'
        FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.client_organization_id IS NOT NULL
        LIMIT 1
      )
    )
  )
);