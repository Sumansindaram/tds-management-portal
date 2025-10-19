-- Fix: Super admins cannot view tds_entries after insert
-- The current "Admins can view all entries" policy only checks for 'admin' role
-- We need to include 'super_admin' as well

DROP POLICY IF EXISTS "Admins can view all entries" ON public.tds_entries;

CREATE POLICY "Admins and super admins can view all entries"
ON public.tds_entries
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);