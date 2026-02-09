
-- Create report_replies table for admin responses to community reports
CREATE TABLE public.report_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.environmental_reports(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_replies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view replies
CREATE POLICY "Anyone can view replies"
ON public.report_replies
FOR SELECT
USING (true);

-- County admins can create replies for reports in their county
CREATE POLICY "County admins can reply to reports in their county"
ON public.report_replies
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'county_admin'::app_role)
  AND auth.uid() = admin_id
  AND EXISTS (
    SELECT 1 FROM public.environmental_reports
    WHERE id = report_replies.report_id
    AND county_id = get_user_county(auth.uid())
  )
);

-- Enable realtime for replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_replies;
