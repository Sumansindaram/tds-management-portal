-- Allow super_admins to update tds_entries as well as admins
DROP POLICY IF EXISTS "Admins can update all entries" ON public.tds_entries;

CREATE POLICY "Admins and super admins can update all entries"
ON public.tds_entries
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);
