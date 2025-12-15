-- Create a function to notify all admins (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.notify_admins(
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Loop through all admin users and create notifications
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id)
    VALUES (admin_user_id, _type, _title, _message, _reference_id);
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.notify_admins TO authenticated;