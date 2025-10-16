-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create TDS entries table
CREATE TABLE public.tds_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  
  -- Asset Owner Details
  ssr_name TEXT NOT NULL,
  ssr_email TEXT NOT NULL,
  
  -- Asset Details
  designation TEXT NOT NULL,
  nsn TEXT NOT NULL,
  asset_code TEXT NOT NULL,
  short_name TEXT NOT NULL,
  
  -- Basic Details
  length TEXT NOT NULL,
  width TEXT NOT NULL,
  height TEXT NOT NULL,
  unladen_weight TEXT NOT NULL,
  laden_weight TEXT NOT NULL,
  alest TEXT NOT NULL,
  lims_25 TEXT NOT NULL,
  lims_28 TEXT NOT NULL,
  out_of_service_date DATE NOT NULL,
  mlc TEXT NOT NULL,
  
  -- Driver Information
  licence TEXT,
  crew_number TEXT,
  passenger_capacity TEXT,
  range TEXT,
  fuel_capacity TEXT,
  single_carriage TEXT,
  dual_carriage TEXT,
  max_speed TEXT,
  
  -- ADAMS
  service TEXT NOT NULL,
  owner_nation TEXT NOT NULL,
  ric_code TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  
  -- Status & Audit
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_comment TEXT,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tds_entries ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to auto-generate reference
CREATE OR REPLACE FUNCTION public.generate_tds_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'TDS-' || LPAD(NEXTVAL('tds_ref_seq')::TEXT, 6, '0');
  RETURN ref;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS tds_ref_seq START 1000;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- TDS entries RLS policies
CREATE POLICY "Users can view own entries"
  ON public.tds_entries FOR SELECT
  USING (auth.uid() = submitted_by);

CREATE POLICY "Users can create entries"
  ON public.tds_entries FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can view all entries"
  ON public.tds_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all entries"
  ON public.tds_entries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('transportation-data', 'transportation-data', false),
  ('supporting-documents', 'supporting-documents', false);

-- Storage RLS policies
CREATE POLICY "Users can upload own transportation data"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'transportation-data' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own transportation data"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'transportation-data' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all transportation data"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'transportation-data' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can upload own supporting documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'supporting-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own supporting documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supporting-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all supporting documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supporting-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Create trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tds_entries_updated_at
  BEFORE UPDATE ON public.tds_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();