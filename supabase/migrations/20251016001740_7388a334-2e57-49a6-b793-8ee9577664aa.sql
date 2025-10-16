-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- RLS policies for user management (super admins only)
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update non-super-admin roles"
  ON public.user_roles FOR UPDATE
  USING (
    public.is_super_admin(auth.uid()) AND
    user_id != auth.uid() AND
    role != 'super_admin'
  );

-- Drop old restrictive policy and add public form submission
DROP POLICY IF EXISTS "Users can create entries" ON public.tds_entries;
CREATE POLICY "Anyone can create entries"
  ON public.tds_entries FOR INSERT
  WITH CHECK (true);

-- Update viewing policy
DROP POLICY IF EXISTS "Users can view own entries" ON public.tds_entries;
CREATE POLICY "Anyone can view entries they submitted"
  ON public.tds_entries FOR SELECT
  USING (submitted_by IS NULL OR auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Update storage policies for public uploads
CREATE POLICY "Anyone can upload transportation data"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'transportation-data');

CREATE POLICY "Anyone can upload supporting documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'supporting-documents');