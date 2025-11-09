-- Fix function search path warnings
-- Update the log_profile_access function to have stable search_path

DROP FUNCTION IF EXISTS public.log_profile_access();

CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when super admins access profiles
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  ) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      'SELECT',
      'profiles',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'full_name', NEW.full_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;