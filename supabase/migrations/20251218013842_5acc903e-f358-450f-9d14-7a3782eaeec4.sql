-- Update handle_new_user function to notify admins when new accounts are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Notify admins about new account creation
  PERFORM public.notify_admins(
    'new_account',
    'Nova conta criada',
    'Um novo usuário se cadastrou: ' || COALESCE(NEW.email, 'Email não informado'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$;