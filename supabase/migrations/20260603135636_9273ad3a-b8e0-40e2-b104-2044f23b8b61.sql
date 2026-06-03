
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_review_status_chk
  CHECK (review_status IN ('new','reviewed','accepted','waitlist','rejected'));

ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_review_status_chk
  CHECK (review_status IN ('new','reviewed','accepted','waitlist','rejected'));

CREATE POLICY "admins update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update rsvps"
  ON public.rsvps FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
