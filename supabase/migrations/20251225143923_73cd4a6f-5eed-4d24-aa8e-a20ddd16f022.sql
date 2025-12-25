-- Update notify_admins function to include 'new_ticket' as an allowed notification type
CREATE OR REPLACE FUNCTION public.notify_admins(_type text, _title text, _message text, _reference_id uuid DEFAULT NULL::uuid, _exclude_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  allowed_types TEXT[] := ARRAY['ticket_status', 'ticket_message', 'chat_message', 'new_account', 'opportunity_update', 'new_ticket'];
BEGIN
  -- Validate notification type to prevent arbitrary notification injection
  IF NOT (_type = ANY(allowed_types)) THEN
    RAISE EXCEPTION 'Invalid notification type: %', _type;
  END IF;
  
  -- Validate input lengths to prevent abuse
  IF length(_title) > 200 THEN
    RAISE EXCEPTION 'Title too long (max 200 characters)';
  END IF;
  
  IF length(_message) > 1000 THEN
    RAISE EXCEPTION 'Message too long (max 1000 characters)';
  END IF;

  -- Loop through all admin users and create notifications, excluding the actor if specified
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin'
    AND (_exclude_user_id IS NULL OR user_id != _exclude_user_id)
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id)
    VALUES (admin_user_id, _type, _title, _message, _reference_id);
  END LOOP;
END;
$function$;

-- Also update the other overload without exclude_user_id
CREATE OR REPLACE FUNCTION public.notify_admins(_type text, _title text, _message text, _reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  allowed_types TEXT[] := ARRAY['ticket_status', 'ticket_message', 'chat_message', 'new_account', 'opportunity_update', 'new_ticket'];
BEGIN
  -- Validate notification type to prevent arbitrary notification injection
  IF NOT (_type = ANY(allowed_types)) THEN
    RAISE EXCEPTION 'Invalid notification type: %', _type;
  END IF;
  
  -- Validate input lengths to prevent abuse
  IF length(_title) > 200 THEN
    RAISE EXCEPTION 'Title too long (max 200 characters)';
  END IF;
  
  IF length(_message) > 1000 THEN
    RAISE EXCEPTION 'Message too long (max 1000 characters)';
  END IF;

  -- Loop through all admin users and create notifications
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id)
    VALUES (admin_user_id, _type, _title, _message, _reference_id);
  END LOOP;
END;
$function$;