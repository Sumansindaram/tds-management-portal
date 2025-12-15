-- Add new columns to new_asset_requests to match BIRD form fields
ALTER TABLE public.new_asset_requests
  -- Part 1 - Sponsor Info
  ADD COLUMN IF NOT EXISTS poc_name TEXT,
  ADD COLUMN IF NOT EXISTS tel_no TEXT,
  ADD COLUMN IF NOT EXISTS uin TEXT,
  ADD COLUMN IF NOT EXISTS rac TEXT,
  ADD COLUMN IF NOT EXISTS management_code TEXT,
  ADD COLUMN IF NOT EXISTS blb_code TEXT,
  
  -- Part 2 - Equipment Details
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS nsn TEXT,
  ADD COLUMN IF NOT EXISTS ric_code TEXT,
  ADD COLUMN IF NOT EXISTS protective_marking TEXT DEFAULT 'Official',
  
  -- Part 3 - Task Requirements
  ADD COLUMN IF NOT EXISTS reason_for_task TEXT DEFAULT 'New Entry',
  ADD COLUMN IF NOT EXISTS tasks_required JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bird_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tech_drawings_attached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposed_trial_dates TEXT,
  ADD COLUMN IF NOT EXISTS delivery_date_to_service TEXT,
  
  -- Part 4 - Driver Information
  ADD COLUMN IF NOT EXISTS licence_category TEXT,
  ADD COLUMN IF NOT EXISTS crew_number TEXT,
  ADD COLUMN IF NOT EXISTS passenger_capacity TEXT,
  ADD COLUMN IF NOT EXISTS fuel_capacity_litres TEXT,
  ADD COLUMN IF NOT EXISTS range_km TEXT,
  ADD COLUMN IF NOT EXISTS speed_single_carriageway TEXT,
  ADD COLUMN IF NOT EXISTS speed_dual_carriageway TEXT,
  ADD COLUMN IF NOT EXISTS max_speed TEXT,
  
  -- Overview
  ADD COLUMN IF NOT EXISTS overview TEXT,
  ADD COLUMN IF NOT EXISTS tasking_description TEXT,
  
  -- BIRD Section - Dimensions
  ADD COLUMN IF NOT EXISTS length_mm TEXT,
  ADD COLUMN IF NOT EXISTS width_mm TEXT,
  ADD COLUMN IF NOT EXISTS height_mm TEXT,
  ADD COLUMN IF NOT EXISTS ground_clearance_mm TEXT,
  ADD COLUMN IF NOT EXISTS approach_angle TEXT,
  ADD COLUMN IF NOT EXISTS departure_angle TEXT,
  ADD COLUMN IF NOT EXISTS front_track_width_mm TEXT,
  ADD COLUMN IF NOT EXISTS rear_track_width_mm TEXT,
  
  -- BIRD Section - Weights
  ADD COLUMN IF NOT EXISTS laden_weight_kg TEXT,
  ADD COLUMN IF NOT EXISTS unladen_weight_kg TEXT,
  ADD COLUMN IF NOT EXISTS mlc_laden TEXT,
  ADD COLUMN IF NOT EXISTS mlc_unladen TEXT,
  
  -- BIRD Section - Other
  ADD COLUMN IF NOT EXISTS turning_circle TEXT,
  ADD COLUMN IF NOT EXISTS cog_height TEXT,
  ADD COLUMN IF NOT EXISTS cog_longitudinal TEXT,
  ADD COLUMN IF NOT EXISTS cog_lateral TEXT,
  ADD COLUMN IF NOT EXISTS tyre_size TEXT,
  ADD COLUMN IF NOT EXISTS tyre_type TEXT,
  ADD COLUMN IF NOT EXISTS lashing_point_info TEXT,
  ADD COLUMN IF NOT EXISTS lifting_eye_positions TEXT,
  ADD COLUMN IF NOT EXISTS removable_items TEXT,
  ADD COLUMN IF NOT EXISTS additional_remarks TEXT;