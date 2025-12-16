-- Add access_authorized field for free user authorization (item 7)
-- This field controls whether a free user has been authorized to access the member area
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_authorized boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.access_authorized IS 'Controls whether a free user has been authorized to access the member area by an admin';