-- Fix storage RLS policies with proper type casting

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own transport data" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own transport data" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own transport data" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own supporting documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own supporting documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own supporting documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all transport data" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all supporting documents" ON storage.objects;

-- Transportation data bucket policies
CREATE POLICY "Users can upload their own transport data"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transportation-data' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

CREATE POLICY "Users can view their own transport data"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'transportation-data' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

CREATE POLICY "Users can delete their own transport data"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'transportation-data' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

-- Supporting documents bucket policies
CREATE POLICY "Users can upload their own supporting documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supporting-documents' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

CREATE POLICY "Users can view their own supporting documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'supporting-documents' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

CREATE POLICY "Users can delete their own supporting documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'supporting-documents' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text OR 
   EXISTS (
     SELECT 1 FROM tds_entries 
     WHERE id::text = SPLIT_PART(name, '/', 2) 
     AND submitted_by::uuid = auth.uid()
   ))
);

-- Admin policies for both buckets
CREATE POLICY "Admins can view all transport data"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'transportation-data' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view all supporting documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'supporting-documents' AND
  public.has_role(auth.uid(), 'admin')
);