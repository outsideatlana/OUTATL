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

CREATE POLICY "members read own profile"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "members create own profile"
  ON public.member_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "members update own profile"
  ON public.member_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
