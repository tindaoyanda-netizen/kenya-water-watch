-- Fix overly permissive INSERT policy on api_logs
DROP POLICY "Service role can insert logs" ON public.api_logs;

-- Only allow authenticated users to insert their own logs
CREATE POLICY "Authenticated users can insert logs"
ON public.api_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);