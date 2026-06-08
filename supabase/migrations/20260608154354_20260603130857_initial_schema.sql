/*
# Initial Schema

Applies the base schema for OutsideAtl. Sets up all core tables, RLS, and roles.

1. New Tables
   - `user_roles` — maps Supabase auth users to app roles (admin)
   - `events` — public event listings
   - `rsvps` — pre-RSVP submissions from attendees
   - `newsletter_subscribers` — mailing list signups
   - `applications` — intern/freelancer/vendor/artist/sponsor applications
   - `contact_messages` — contact form submissions

2. Security
   - RLS enabled on all tables.
   - Public inserts allowed on rsvps, newsletter_subscribers, applications, contact_messages.
   - Admin-role users can view/manage all records.
   - has_role() helper function for role checks.

3. Notes
   - Idempotent — safe to re-run.
*/

-- Roles enum and user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own roles" ON public.user_roles;
CREATE POLICY "users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  age_restriction TEXT,
  status TEXT NOT NULL DEFAULT 'on_sale',
  description TEXT,
  poster_url TEXT,
  ticket_url TEXT,
  is_past BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can view published events" ON public.events;
CREATE POLICY "anyone can view published events" ON public.events
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admins manage events" ON public.events;
CREATE POLICY "admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RSVPs
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age_range TEXT,
  social_handle TEXT,
  college_affiliation TEXT,
  preferred_event_types TEXT,
  notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rsvps_review_status_chk CHECK (review_status IN ('new','reviewed','accepted','waitlist','rejected'))
);
GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT SELECT ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can rsvp" ON public.rsvps;
CREATE POLICY "anyone can rsvp" ON public.rsvps
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins view rsvps" ON public.rsvps;
CREATE POLICY "admins view rsvps" ON public.rsvps
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update rsvps" ON public.rsvps;
CREATE POLICY "admins update rsvps" ON public.rsvps
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  signup_source TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admins view subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  stage_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  tiktok TEXT,
  portfolio_url TEXT,
  music_url TEXT,
  preferred_role TEXT,
  experience_level TEXT,
  genre TEXT,
  past_experience TEXT,
  expected_rate TEXT,
  preferred_event_type TEXT,
  availability TEXT,
  message TEXT,
  extra JSONB DEFAULT '{}'::jsonb,
  review_status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT applications_application_type_check CHECK (application_type IN ('intern','freelancer','vendor','artist','sponsor')),
  CONSTRAINT applications_review_status_chk CHECK (review_status IN ('new','reviewed','accepted','waitlist','rejected'))
);
GRANT INSERT ON public.applications TO anon, authenticated;
GRANT SELECT ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can apply" ON public.applications;
CREATE POLICY "anyone can apply" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins view applications" ON public.applications;
CREATE POLICY "admins view applications" ON public.applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update applications" ON public.applications;
CREATE POLICY "admins update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can contact" ON public.contact_messages;
CREATE POLICY "anyone can contact" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins view contact" ON public.contact_messages;
CREATE POLICY "admins view contact" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Deal / private event signups
CREATE TABLE IF NOT EXISTS public.deal_private_event_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  signup_source TEXT NOT NULL DEFAULT 'homepage',
  consent_marketing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.deal_private_event_signups TO service_role;
ALTER TABLE public.deal_private_event_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages deal private event signups" ON public.deal_private_event_signups;
CREATE POLICY "service role manages deal private event signups"
  ON public.deal_private_event_signups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admins view deal signups" ON public.deal_private_event_signups;
CREATE POLICY "admins view deal signups"
  ON public.deal_private_event_signups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Member profiles
CREATE TABLE IF NOT EXISTS public.member_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  wants_discounts BOOLEAN NOT NULL DEFAULT true,
  wants_private_events BOOLEAN NOT NULL DEFAULT true,
  wants_first_notices BOOLEAN NOT NULL DEFAULT true,
  joined_mail_list BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.member_profiles TO authenticated;
GRANT ALL ON public.member_profiles TO service_role;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read own profile" ON public.member_profiles;
CREATE POLICY "members read own profile"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "members create own profile" ON public.member_profiles;
CREATE POLICY "members create own profile"
  ON public.member_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "members update own profile" ON public.member_profiles;
CREATE POLICY "members update own profile"
  ON public.member_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
