-- Fix: Drop the original 0-arg get_overview_dashboard function
-- The previous migration created an overload instead of replacing

drop function if exists public.get_overview_dashboard();

-- Ensure the 4-arg version has proper grants
revoke all on function public.get_overview_dashboard(uuid, uuid, date, date) from public, anon, authenticated;
grant execute on function public.get_overview_dashboard(uuid, uuid, date, date) to authenticated;
