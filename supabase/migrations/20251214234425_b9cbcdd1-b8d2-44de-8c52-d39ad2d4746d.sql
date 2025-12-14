-- Create new_asset_requests table for PT new asset TDS requests
CREATE TABLE public.new_asset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Pending',
  
  -- Task Information
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  urgency_level TEXT NOT NULL DEFAULT 'Normal',
  required_by_date DATE,
  
  -- Basic Asset Information
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  estimated_weight_kg TEXT,
  estimated_dimensions TEXT,
  
  -- Additional Information
  project_team TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_justification TEXT,
  
  -- Admin fields
  admin_comment TEXT,
  assigned_to UUID
);

-- Create sequence for new asset request reference numbers
CREATE SEQUENCE IF NOT EXISTS new_asset_ref_seq START WITH 1;

-- Create function to generate new asset request reference
CREATE OR REPLACE FUNCTION public.generate_new_asset_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'NAR-' || LPAD(NEXTVAL('new_asset_ref_seq')::TEXT, 6, '0');
  RETURN ref;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.new_asset_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new_asset_requests
CREATE POLICY "Users can view their own requests"
ON public.new_asset_requests
FOR SELECT
USING (submitted_by = auth.uid());

CREATE POLICY "Admins can view all requests"
ON public.new_asset_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can create requests"
ON public.new_asset_requests
FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can update all requests"
ON public.new_asset_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can update their own pending requests"
ON public.new_asset_requests
FOR UPDATE
USING (submitted_by = auth.uid() AND status IN ('Pending', 'Returned'))
WITH CHECK (submitted_by = auth.uid());

-- Create new_asset_documents table to track uploaded documents
CREATE TABLE public.new_asset_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.new_asset_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT
);

-- Enable RLS for documents
ALTER TABLE public.new_asset_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their requests"
ON public.new_asset_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.new_asset_requests
    WHERE id = new_asset_documents.request_id
    AND submitted_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all documents"
ON public.new_asset_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can upload documents to their requests"
ON public.new_asset_documents
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.new_asset_requests
    WHERE id = new_asset_documents.request_id
    AND (submitted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

CREATE POLICY "Admins can insert documents"
ON public.new_asset_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create storage bucket for new asset documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('new-asset-documents', 'new-asset-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for new asset documents bucket
CREATE POLICY "Users can upload to their request folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'new-asset-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own request documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'new-asset-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'new-asset-documents' AND
  auth.role() = 'authenticated'
);

-- Trigger to update updated_at
CREATE TRIGGER update_new_asset_requests_updated_at
BEFORE UPDATE ON public.new_asset_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();