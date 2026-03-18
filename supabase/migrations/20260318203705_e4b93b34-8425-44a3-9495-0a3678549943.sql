-- Phase 1, Step 2: Time-series table for historical water/flood/sensor data

CREATE TABLE public.water_metrics_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id text NOT NULL,
    recorded_at timestamp with time zone NOT NULL DEFAULT now(),
    metric_type text NOT NULL,
    metric_value numeric NOT NULL,
    source text DEFAULT 'manual',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for time-series queries
CREATE INDEX idx_water_metrics_county_time ON public.water_metrics_history (county_id, recorded_at DESC);
CREATE INDEX idx_water_metrics_type_time ON public.water_metrics_history (metric_type, recorded_at DESC);

-- Enable RLS
ALTER TABLE public.water_metrics_history ENABLE ROW LEVEL SECURITY;

-- Public read access for dashboards
CREATE POLICY "Anyone can view water metrics"
ON public.water_metrics_history FOR SELECT
TO public
USING (true);

-- Only county admins can insert metrics for their county
CREATE POLICY "County admins can insert metrics for their county"
ON public.water_metrics_history FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'county_admin'::app_role) 
    AND county_id = get_user_county(auth.uid())
);

-- Phase 1, Step 4: API logging table for monitoring

CREATE TABLE public.api_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    status_code integer,
    duration_ms integer,
    error_message text,
    request_metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_logs_function_time ON public.api_logs (function_name, created_at DESC);
CREATE INDEX idx_api_logs_status ON public.api_logs (status_code) WHERE status_code >= 400;

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "County admins can view logs"
ON public.api_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'county_admin'::app_role));

-- Edge functions insert logs via service role (no RLS needed for inserts from service role)
CREATE POLICY "Service role can insert logs"
ON public.api_logs FOR INSERT
TO authenticated
WITH CHECK (true);