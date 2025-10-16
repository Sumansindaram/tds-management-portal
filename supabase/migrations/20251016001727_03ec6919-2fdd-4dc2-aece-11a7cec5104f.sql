-- Fix security warnings for existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_tds_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'TDS-' || LPAD(NEXTVAL('tds_ref_seq')::TEXT, 6, '0');
  RETURN ref;
END;
$$;