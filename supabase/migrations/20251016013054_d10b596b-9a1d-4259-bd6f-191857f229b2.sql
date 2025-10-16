-- Create tds_entry_comments table for audit trail
CREATE TABLE IF NOT EXISTS public.tds_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.tds_entries(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  admin_name TEXT NOT NULL,
  status TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_tds_entry_comments_entry_id ON public.tds_entry_comments(entry_id);
CREATE INDEX idx_tds_entry_comments_created_at ON public.tds_entry_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.tds_entry_comments ENABLE ROW LEVEL SECURITY;

-- Admins and super admins can view all comments
CREATE POLICY "Admins and super admins can view all comments"
ON public.tds_entry_comments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins and super admins can insert comments
CREATE POLICY "Admins and super admins can insert comments"
ON public.tds_entry_comments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- No updates or deletes allowed (immutable audit log)