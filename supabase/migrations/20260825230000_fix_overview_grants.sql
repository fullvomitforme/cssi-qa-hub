-- Fix grants for get_overview_dashboard function
-- Ensure both authenticated and anon roles have execute permission

DO $$
BEGIN
  -- Revoke all existing grants
  REVOKE ALL ON FUNCTION public.get_overview_dashboard(uuid, uuid, date, date) FROM PUBLIC, anon, authenticated;

  -- Grant execute to authenticated and anon roles
  GRANT EXECUTE ON FUNCTION public.get_overview_dashboard(uuid, uuid, date, date) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.get_overview_dashboard(uuid, uuid, date, date) TO anon;
END
$$;
