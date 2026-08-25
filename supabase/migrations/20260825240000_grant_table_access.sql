-- Grant SELECT on all tables used by get_overview_dashboard function
-- This is needed because the function uses security invoker

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Grant SELECT on all tables in public schema that the function might need
  FOR r IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', r.tablename);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', r.tablename);
  END LOOP;
END
$$;
