-- Create SSR change history table for tracking SSR replacements
CREATE TABLE public.ssr_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ssr_record_id UUID NOT NULL REFERENCES public.ssrs(id) ON DELETE CASCADE,
  previous_title TEXT,
  previous_first_name TEXT NOT NULL,
  previous_last_name TEXT NOT NULL,
  previous_email TEXT NOT NULL,
  previous_phone TEXT,
  previous_role_type TEXT NOT NULL,
  replaced_by_title TEXT,
  replaced_by_first_name TEXT NOT NULL,
  replaced_by_last_name TEXT NOT NULL,
  replaced_by_email TEXT NOT NULL,
  replaced_by_user_id UUID,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ssr_change_history ENABLE ROW LEVEL SECURITY;

-- Only admins and super admins can view change history
CREATE POLICY "Admins can view SSR change history"
ON public.ssr_change_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Only admins and super admins can insert change history
CREATE POLICY "Admins can insert SSR change history"
ON public.ssr_change_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_ssr_change_history_record_id ON public.ssr_change_history(ssr_record_id);