-- Create function to ensure at least one super admin always exists
CREATE OR REPLACE FUNCTION public.ensure_super_admin_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  -- Count remaining super admins after this operation
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO super_admin_count
    FROM public.user_roles
    WHERE role = 'super_admin' AND user_id != OLD.user_id;
    
    IF super_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last super admin. At least one super admin must exist.';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if we're changing a super_admin to something else
    IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
      SELECT COUNT(*) INTO super_admin_count
      FROM public.user_roles
      WHERE role = 'super_admin' AND user_id != OLD.user_id;
      
      IF super_admin_count = 0 THEN
        RAISE EXCEPTION 'Cannot demote the last super admin. At least one super admin must exist.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent removing the last super admin
DROP TRIGGER IF EXISTS prevent_last_super_admin_removal ON public.user_roles;
CREATE TRIGGER prevent_last_super_admin_removal
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_super_admin_exists();