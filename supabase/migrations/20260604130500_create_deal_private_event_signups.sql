CREATE TABLE IF NOT EXISTS public.deal_private_event_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  signup_source TEXT NOT NULL DEFAULT 'homepage',
  consent_marketing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.deal_private_event_signups TO service_role;
ALTER TABLE public.deal_private_event_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages deal private event signups"
  ON public.deal_private_event_signups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
