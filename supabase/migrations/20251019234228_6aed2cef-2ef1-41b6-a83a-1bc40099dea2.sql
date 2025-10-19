-- Add secure INSERT policies for storage buckets

-- Policy for transportation-data bucket
-- Only authenticated users can upload files to their own entries
-- Files must follow the path structure: nsn/entry_id/filename
-- Only specific file types are allowed
CREATE POLICY "Users can upload transportation files to their entries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transportation-data' AND
  -- Verify the entry exists and belongs to the user
  EXISTS (
    SELECT 1 FROM public.tds_entries e
    WHERE e.id::text = (storage.foldername(name))[2]
      AND e.submitted_by = auth.uid()
      AND e.nsn = (storage.foldername(name))[1]
  ) AND
  -- Validate file extensions (PDF, images, documents)
  (
    LOWER(SUBSTRING(name FROM '\.([^.]*)$')) IN ('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx')
  )
);

-- Policy for supporting-documents bucket
-- Same restrictions as transportation-data
CREATE POLICY "Users can upload supporting documents to their entries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supporting-documents' AND
  -- Verify the entry exists and belongs to the user
  EXISTS (
    SELECT 1 FROM public.tds_entries e
    WHERE e.id::text = (storage.foldername(name))[2]
      AND e.submitted_by = auth.uid()
      AND e.nsn = (storage.foldername(name))[1]
  ) AND
  -- Validate file extensions
  (
    LOWER(SUBSTRING(name FROM '\.([^.]*)$')) IN ('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx')
  )
);

-- Add UPDATE policy to prevent modifying existing files
-- Users should not be able to overwrite files after upload
CREATE POLICY "Prevent file modification"
ON storage.objects FOR UPDATE
TO authenticated
USING (false);

-- Add DELETE policy - only allow users to delete their own entry files
CREATE POLICY "Users can delete their own transportation files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'transportation-data' AND
  EXISTS (
    SELECT 1 FROM public.tds_entries e
    WHERE e.id::text = (storage.foldername(name))[2]
      AND e.submitted_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own supporting documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'supporting-documents' AND
  EXISTS (
    SELECT 1 FROM public.tds_entries e
    WHERE e.id::text = (storage.foldername(name))[2]
      AND e.submitted_by = auth.uid()
  )
);