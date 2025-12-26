-- Remove the old duplicate policy that still exists
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;