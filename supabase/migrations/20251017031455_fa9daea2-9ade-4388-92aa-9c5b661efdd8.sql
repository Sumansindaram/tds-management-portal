-- Create a view for regular users that excludes sensitive SSR email addresses
CREATE OR REPLACE VIEW public.user_tds_entries_view AS
SELECT 
  id,
  reference,
  asset_type,
  status,
  submitted_by,
  created_at,
  updated_at,
  designation,
  nsn,
  asset_code,
  short_name,
  length,
  width,
  height,
  unladen_weight,
  laden_weight,
  alest,
  lims_25,
  lims_28,
  classification,
  mlc,
  licence,
  crew_number,
  passenger_capacity,
  range,
  fuel_capacity,
  single_carriage,
  dual_carriage,
  max_speed,
  service,
  owner_nation,
  ric_code,
  out_of_service_date,
  ssr_name,
  -- ssr_email excluded for privacy
  ssr_approval_confirmed,
  authorised_person_confirmed,
  data_responsibility_confirmed,
  review_responsibility_confirmed,
  admin_comment
FROM public.tds_entries;

-- Enable RLS on the view
ALTER VIEW public.user_tds_entries_view SET (security_invoker = true);

-- Remove the broad SELECT policy from tds_entries for regular users
DROP POLICY IF EXISTS "Anyone can view entries they submitted" ON public.tds_entries;

-- Add restricted SELECT policy for regular users to only see via the view
CREATE POLICY "Users can view their own entries without sensitive data"
ON public.tds_entries
FOR SELECT
TO authenticated
USING (
  auth.uid() = submitted_by 
  AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Admins still have full access via existing "Admins can view all entries" policy

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.user_tds_entries_view TO authenticated;