-- Grant SELECT on specific tables used by get_overview_dashboard
GRANT SELECT ON public.applications TO authenticated;
GRANT SELECT ON public.applications TO anon;
GRANT SELECT ON public.test_scenarios TO authenticated;
GRANT SELECT ON public.test_scenarios TO anon;
GRANT SELECT ON public.test_executions TO authenticated;
GRANT SELECT ON public.test_executions TO anon;
GRANT SELECT ON public.test_runs TO authenticated;
GRANT SELECT ON public.test_runs TO anon;
GRANT SELECT ON public.environments TO authenticated;
GRANT SELECT ON public.environments TO anon;
GRANT SELECT ON public.releases TO authenticated;
GRANT SELECT ON public.releases TO anon;
GRANT SELECT ON public.failures TO authenticated;
GRANT SELECT ON public.failures TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
