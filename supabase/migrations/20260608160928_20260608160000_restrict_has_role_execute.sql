REVOKE EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
