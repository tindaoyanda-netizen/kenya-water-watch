
-- Update report_replies SELECT policy to allow residents to see replies on their own reports
DROP POLICY IF EXISTS "Anyone can view replies" ON public.report_replies;

CREATE POLICY "Anyone can view replies"
ON public.report_replies
FOR SELECT
USING (true);
