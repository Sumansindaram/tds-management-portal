-- Set all existing users to approved
UPDATE public.profiles SET approved = true WHERE approved = false OR approved IS NULL;

-- Change default for new users to approved
ALTER TABLE public.profiles ALTER COLUMN approved SET DEFAULT true;

-- Update the handle_new_user function to set approved to true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    true
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;