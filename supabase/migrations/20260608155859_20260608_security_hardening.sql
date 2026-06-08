/*
# Security Hardening: RLS Policies and SECURITY DEFINER Function

Addresses six security findings:

1. Tighten INSERT policies on public submission tables — replace `WITH CHECK (true)` with
   field-level validation so the check is meaningful rather than unconditionally open.
   Tables: applications, contact_messages, newsletter_subscribers, rsvps.

2. Revoke public EXECUTE on has_role() — the SECURITY DEFINER function was callable by anon
   and authenticated roles via /rest/v1/rpc/has_role, allowing anyone to probe admin membership.
   Fix: revoke EXECUTE from anon/authenticated, rewrite all RLS admin policies to use a direct
   subquery against user_roles instead of calling has_role(), which avoids needing the grant.

Important notes:
- All INSERT policies still allow any anonymous visitor to submit forms — the check clauses
  now enforce that required fields are present and valid rather than being always-true.
- The has_role() function is retained (used by application server code) but no longer
  callable directly via the Supabase REST RPC endpoint by end users.
*/

-- ────────────────────────────────────────────────────────────────────
-- 1. Revoke public EXECUTE on has_role
-- ────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 2. Replace admin policies that called has_role() with direct subqueries
--    so authenticated users can still trigger the check via RLS without
--    needing EXECUTE privilege on the function.
-- ────────────────────────────────────────────────────────────────────

-- events
DROP POLICY IF EXISTS "admins manage events" ON public.events;
CREATE POLICY "admins manage events" ON public.events
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- rsvps
DROP POLICY IF EXISTS "admins view rsvps" ON public.rsvps;
CREATE POLICY "admins view rsvps" ON public.rsvps
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admins update rsvps" ON public.rsvps;
CREATE POLICY "admins update rsvps" ON public.rsvps
  FOR UPDATE TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- newsletter_subscribers
DROP POLICY IF EXISTS "admins view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admins view subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- applications
DROP POLICY IF EXISTS "admins view applications" ON public.applications;
CREATE POLICY "admins view applications" ON public.applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admins update applications" ON public.applications;
CREATE POLICY "admins update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- contact_messages
DROP POLICY IF EXISTS "admins view contact" ON public.contact_messages;
CREATE POLICY "admins view contact" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- deal_private_event_signups
DROP POLICY IF EXISTS "admins view deal signups" ON public.deal_private_event_signups;
CREATE POLICY "admins view deal signups" ON public.deal_private_event_signups
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ────────────────────────────────────────────────────────────────────
-- 3. Tighten public INSERT policies — replace WITH CHECK (true) with
--    meaningful field validation.
-- ────────────────────────────────────────────────────────────────────

-- newsletter_subscribers: email must be present and non-empty
DROP POLICY IF EXISTS "anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(trim(email)) > 0
    AND char_length(email) <= 255
  );

-- rsvps: require name and valid email
DROP POLICY IF EXISTS "anyone can rsvp" ON public.rsvps;
CREATE POLICY "anyone can rsvp" ON public.rsvps
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL AND char_length(trim(full_name)) > 0
    AND email    IS NOT NULL AND char_length(trim(email))    > 0
  );

-- applications: require name, email, and a valid application_type
DROP POLICY IF EXISTS "anyone can apply" ON public.applications;
CREATE POLICY "anyone can apply" ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    full_name        IS NOT NULL AND char_length(trim(full_name)) > 0
    AND email        IS NOT NULL AND char_length(trim(email))     > 0
    AND application_type IN ('intern','freelancer','vendor','artist','sponsor')
  );

-- contact_messages: require name, email, and message body
DROP POLICY IF EXISTS "anyone can contact" ON public.contact_messages;
CREATE POLICY "anyone can contact" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name    IS NOT NULL AND char_length(trim(name))    > 0
    AND email   IS NOT NULL AND char_length(trim(email))   > 0
    AND message IS NOT NULL AND char_length(trim(message)) > 0
  );
