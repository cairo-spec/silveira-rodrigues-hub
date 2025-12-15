-- Drop existing SELECT policies on profiles table and recreate with explicit authentication check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a single unified SELECT policy that requires authentication and checks ownership or admin role
CREATE POLICY "Authenticated users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add explicit deny for anonymous users by only granting to authenticated role
-- The above policy uses "TO authenticated" which automatically excludes anon users