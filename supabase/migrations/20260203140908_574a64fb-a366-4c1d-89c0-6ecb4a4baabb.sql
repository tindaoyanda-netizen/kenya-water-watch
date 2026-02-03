-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('resident', 'county_admin');

-- Create enum for report types
CREATE TYPE public.report_type AS ENUM ('flooded_road', 'dry_borehole', 'broken_kiosk', 'overflowing_river');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'verified', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    county_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create environmental_reports table
CREATE TABLE public.environmental_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_type report_type NOT NULL,
    county_id TEXT NOT NULL,
    town_name TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    image_url TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
    ai_analysis TEXT,
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of UUID REFERENCES public.environmental_reports(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_verifications table
CREATE TABLE public.report_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.environmental_reports(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action report_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_verifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's county
CREATE OR REPLACE FUNCTION public.get_user_county(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT county_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Environmental reports policies
CREATE POLICY "Anyone can view reports"
ON public.environmental_reports FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reports"
ON public.environmental_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "County admins can update reports in their county"
ON public.environmental_reports FOR UPDATE
USING (
    public.has_role(auth.uid(), 'county_admin') AND
    county_id = public.get_user_county(auth.uid())
);

-- Report verifications policies
CREATE POLICY "Anyone can view verifications"
ON public.report_verifications FOR SELECT
USING (true);

CREATE POLICY "County admins can create verifications for their county"
ON public.report_verifications FOR INSERT
WITH CHECK (
    public.has_role(auth.uid(), 'county_admin') AND
    EXISTS (
        SELECT 1 FROM public.environmental_reports
        WHERE id = report_id
        AND county_id = public.get_user_county(auth.uid())
    )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to environmental_reports
CREATE TRIGGER update_environmental_reports_updated_at
BEFORE UPDATE ON public.environmental_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.environmental_reports;