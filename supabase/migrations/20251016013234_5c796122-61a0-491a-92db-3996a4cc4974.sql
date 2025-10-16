-- Allow users to view comment history on their own submissions
CREATE POLICY "Users can view comments on their own entries"
ON public.tds_entry_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tds_entries
    WHERE tds_entries.id = tds_entry_comments.entry_id
    AND tds_entries.submitted_by = auth.uid()
  )
);