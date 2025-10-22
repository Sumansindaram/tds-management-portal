-- Add user_comment field to tds_entries table
ALTER TABLE public.tds_entries
ADD COLUMN user_comment TEXT;

COMMENT ON COLUMN public.tds_entries.user_comment IS 'Comments from the user submitting or resubmitting the form';