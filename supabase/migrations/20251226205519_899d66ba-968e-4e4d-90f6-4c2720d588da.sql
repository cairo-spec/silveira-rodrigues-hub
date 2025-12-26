-- Update handle_new_user function to mask email in notifications for privacy
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  masked_email TEXT;
BEGIN
  -- Mask email for privacy: show only first char + *** + domain
  masked_email := CASE 
    WHEN NEW.email IS NULL THEN 'Email não informado'
    WHEN position('@' in NEW.email) > 1 THEN
      substring(NEW.email from 1 for 1) || '***@' || split_part(NEW.email, '@', 2)
    ELSE 'Email inválido'
  END;

  -- Check if this is a trial signup
  IF (NEW.raw_user_meta_data ->> 'trial_signup')::boolean = true THEN
    -- Insert profile with trial active AND access authorized
    INSERT INTO public.profiles (user_id, nome, email, telefone, trial_active, trial_expires_at, access_authorized)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
      NEW.email,
      NEW.raw_user_meta_data ->> 'telefone',
      true,
      (now() + interval '30 days'),
      true
    );
  ELSE
    -- Insert profile without trial
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
      NEW.email
    );
  END IF;
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Notify admins about new account creation with MASKED email
  PERFORM public.notify_admins(
    'new_account',
    'Nova conta criada' || CASE WHEN (NEW.raw_user_meta_data ->> 'trial_signup')::boolean = true THEN ' (Trial 30 dias)' ELSE '' END,
    'Um novo usuário se cadastrou: ' || masked_email,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;