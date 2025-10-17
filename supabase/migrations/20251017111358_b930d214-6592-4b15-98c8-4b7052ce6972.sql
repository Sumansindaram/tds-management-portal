-- Ensure the view uses security_invoker and security_barrier
-- security_invoker = true means the view executes with the privileges of the user calling it
-- security_barrier = true prevents optimization that could leak data
ALTER VIEW public.user_tds_entries_view SET (security_invoker = true, security_barrier = true);

-- Revoke any broad access
REVOKE ALL ON public.user_tds_entries_view FROM PUBLIC;
REVOKE ALL ON public.user_tds_entries_view FROM anon;

-- Grant SELECT only to authenticated users
-- The underlying tds_entries table's RLS policies will control actual access
GRANT SELECT ON public.user_tds_entries_view TO authenticated;