-- Policy: Admins can manage wardens
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'wardens' AND policyname = 'Admins can manage wardens'
  ) THEN
    CREATE POLICY "Admins can manage wardens"
    ON public.wardens
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');
  END IF;
END $$;

-- Function: admin_find_profile_by_email
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
$$;

-- Restrict function execution to authenticated users only
REVOKE ALL ON FUNCTION public.admin_find_profile_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_find_profile_by_email(text) TO authenticated;