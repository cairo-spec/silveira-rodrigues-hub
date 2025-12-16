-- Add trial_expires_at column to profiles for 30-day auto-expiration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.profiles.trial_expires_at IS 'Date when trial period expires (30 days from activation)';