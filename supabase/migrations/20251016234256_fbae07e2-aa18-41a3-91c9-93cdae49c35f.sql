-- Add terms acceptance fields to tds_entries table
ALTER TABLE tds_entries 
ADD COLUMN ssr_approval_confirmed boolean DEFAULT false,
ADD COLUMN authorised_person_confirmed boolean DEFAULT false,
ADD COLUMN data_responsibility_confirmed boolean DEFAULT false,
ADD COLUMN review_responsibility_confirmed boolean DEFAULT false;