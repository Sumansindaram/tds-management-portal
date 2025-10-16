-- Drop old restrictive policy
DROP POLICY IF EXISTS "Super admins can update non-super-admin roles" ON public.user_roles;

-- New policy: Super admins can update any role EXCEPT their own
CREATE POLICY "Super admins can update any role except their own"
  ON public.user_roles FOR UPDATE
  USING (
    public.is_super_admin(auth.uid()) AND
    user_id != auth.uid()
  );