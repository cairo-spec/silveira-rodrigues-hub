-- Drop the older version of notify_admins (4 parameters) to resolve ambiguity
DROP FUNCTION IF EXISTS public.notify_admins(text, text, text, uuid);

-- The remaining function has 5 parameters with _exclude_user_id having a default value
-- This will handle all cases properly