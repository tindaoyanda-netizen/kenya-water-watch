ALTER TABLE public.environmental_reports 
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS road_name text,
  ADD COLUMN IF NOT EXISTS sub_location text;