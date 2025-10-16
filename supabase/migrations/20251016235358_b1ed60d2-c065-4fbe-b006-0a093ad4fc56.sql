-- Add classification field to tds_entries table
ALTER TABLE public.tds_entries
ADD COLUMN classification text;

-- Add check constraint for valid classification values
ALTER TABLE public.tds_entries
ADD CONSTRAINT classification_check CHECK (
  classification IN (
    'Official',
    'Official-Sensitive',
    'Official Secret',
    'Official-Sensitive Secret',
    'Unclassified',
    'Other',
    'Not Applicable'
  ) OR classification IS NULL
);