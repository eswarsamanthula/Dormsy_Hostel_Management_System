-- Harden RPC: admin_find_profile_by_email must only return for admins
CREATE OR REPLACE FUNCTION public.admin_find_profile_by_email(p_email text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT p.id, p.email, p.full_name, p.role, p.is_active
  FROM public.profiles p
  WHERE p.email = p_email
    AND public.get_current_user_role() = 'admin'::public.user_role
$$;

-- Ensure execute privilege is scoped
REVOKE ALL ON FUNCTION public.admin_find_profile_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_find_profile_by_email(text) TO authenticated;