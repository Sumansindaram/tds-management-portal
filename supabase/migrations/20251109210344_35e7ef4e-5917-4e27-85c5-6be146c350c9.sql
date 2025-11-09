-- Add approval status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Create SSRs (Safety Responsible) table
CREATE TABLE IF NOT EXISTS public.ssrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_team TEXT NOT NULL,
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SSR Assets table
CREATE TABLE IF NOT EXISTS public.ssr_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ssr_id UUID NOT NULL REFERENCES public.ssrs(id) ON DELETE CASCADE,
  nsn TEXT NOT NULL,
  asset_code TEXT NOT NULL,
  designation TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  short_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ssrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssr_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SSRs
CREATE POLICY "Authenticated users can view SSRs"
  ON public.ssrs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert SSRs"
  ON public.ssrs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update SSRs"
  ON public.ssrs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete SSRs"
  ON public.ssrs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for SSR Assets
CREATE POLICY "Authenticated users can view SSR assets"
  ON public.ssr_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert SSR assets"
  ON public.ssr_assets FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update SSR assets"
  ON public.ssr_assets FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete SSR assets"
  ON public.ssr_assets FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Update triggers for timestamps
CREATE TRIGGER update_ssrs_updated_at
  BEFORE UPDATE ON public.ssrs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ssr_assets_updated_at
  BEFORE UPDATE ON public.ssr_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Update the handle_new_user function to set approved to false by default
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
    false
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;