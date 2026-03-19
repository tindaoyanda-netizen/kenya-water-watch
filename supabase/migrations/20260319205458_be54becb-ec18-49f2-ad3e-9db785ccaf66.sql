ALTER TABLE public.environmental_reports
  ADD COLUMN IF NOT EXISTS severity_level text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS escalated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS photo_validation text;

CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.environmental_reports(severity_level);
CREATE INDEX IF NOT EXISTS idx_reports_escalated ON public.environmental_reports(escalated) WHERE escalated = true;

CREATE TABLE IF NOT EXISTS public.flood_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id text NOT NULL,
  prediction_date date NOT NULL DEFAULT CURRENT_DATE,
  risk_level text NOT NULL DEFAULT 'low',
  confidence numeric NOT NULL DEFAULT 0,
  factors jsonb DEFAULT '{}'::jsonb,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flood_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flood predictions"
  ON public.flood_predictions FOR SELECT
  TO public USING (true);

CREATE POLICY "County admins can insert predictions"
  ON public.flood_predictions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'county_admin'::app_role));

CREATE INDEX idx_flood_predictions_county_date ON public.flood_predictions(county_id, prediction_date DESC);

CREATE TABLE IF NOT EXISTS public.water_stress_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id text NOT NULL,
  stress_score numeric NOT NULL DEFAULT 0,
  components jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.water_stress_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view water stress index"
  ON public.water_stress_index FOR SELECT
  TO public USING (true);

CREATE POLICY "County admins can insert stress index"
  ON public.water_stress_index FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'county_admin'::app_role));

CREATE INDEX idx_water_stress_county ON public.water_stress_index(county_id, calculated_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.flood_predictions