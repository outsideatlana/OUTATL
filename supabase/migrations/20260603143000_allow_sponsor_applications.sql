ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_application_type_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_application_type_check
  CHECK (application_type IN ('intern','freelancer','vendor','artist','sponsor'));
