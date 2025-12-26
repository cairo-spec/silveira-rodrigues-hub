-- Update the handle_new_user function to also set access_authorized for trial signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  
  -- Notify admins about new account creation
  PERFORM public.notify_admins(
    'new_account',
    'Nova conta criada' || CASE WHEN (NEW.raw_user_meta_data ->> 'trial_signup')::boolean = true THEN ' (Trial 30 dias)' ELSE '' END,
    'Um novo usuário se cadastrou: ' || COALESCE(NEW.email, 'Email não informado'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$;