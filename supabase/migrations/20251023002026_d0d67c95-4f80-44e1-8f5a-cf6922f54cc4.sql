-- Allow users to update their own entries when status is Returned
CREATE POLICY "Users can update their own returned entries"
ON public.tds_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = submitted_by AND
  status = 'Returned'
)
WITH CHECK (
  auth.uid() = submitted_by AND
  status = 'Pending'
);