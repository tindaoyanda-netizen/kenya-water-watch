
-- Fix: Convert restrictive policies to permissive so they work correctly

-- environmental_reports: fix UPDATE policy
DROP POLICY IF EXISTS "County admins can update reports in their county" ON public.environmental_reports;
CREATE POLICY "County admins can update reports in their county"
ON public.environmental_reports
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'county_admin'::app_role) 
  AND county_id = get_user_county(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'county_admin'::app_role) 
  AND county_id = get_user_county(auth.uid())
);

-- report_verifications: fix INSERT policy
DROP POLICY IF EXISTS "County admins can create verifications for their county" ON public.report_verifications;
CREATE POLICY "County admins can create verifications for their county"
ON public.report_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'county_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM environmental_reports
    WHERE environmental_reports.id = report_verifications.report_id
    AND environmental_reports.county_id = get_user_county(auth.uid())
  )
);

-- Also fix SELECT policies to be permissive
DROP POLICY IF EXISTS "Anyone can view verifications" ON public.report_verifications;
CREATE POLICY "Anyone can view verifications"
ON public.report_verifications
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view reports" ON public.environmental_reports;
CREATE POLICY "Anyone can view reports"
ON public.environmental_reports
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.environmental_reports;
CREATE POLICY "Authenticated users can create reports"
ON public.environmental_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Fix report_replies policies too
DROP POLICY IF EXISTS "Anyone can view replies" ON public.report_replies;
CREATE POLICY "Anyone can view replies"
ON public.report_replies
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "County admins can reply to reports in their county" ON public.report_replies;
CREATE POLICY "County admins can reply to reports in their county"
ON public.report_replies
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'county_admin'::app_role) 
  AND auth.uid() = admin_id 
  AND EXISTS (
    SELECT 1 FROM environmental_reports
    WHERE environmental_reports.id = report_replies.report_id
    AND environmental_reports.county_id = get_user_county(auth.uid())
  )
);

-- Fix user_roles and profiles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
