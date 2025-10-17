-- Remove the insecure policy that allows anyone to create entries
DROP POLICY IF EXISTS "Anyone can create entries" ON public.tds_entries;

-- Add secure policy: Only authenticated users can create entries
CREATE POLICY "Authenticated users can create entries"
ON public.tds_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = submitted_by);

-- Make submitted_by column NOT NULL to prevent anonymous entries
ALTER TABLE public.tds_entries 
ALTER COLUMN submitted_by SET NOT NULL;