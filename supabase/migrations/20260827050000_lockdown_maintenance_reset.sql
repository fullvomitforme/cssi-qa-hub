-- Migration: Lock down maintenance_reset function privileges
-- Only service_role (supabase_admin) should be able to invoke this

begin;

-- Revoke from everyone
revoke execute on function public.maintenance_reset() from public;
revoke execute on function public.maintenance_reset() from authenticated;
revoke execute on function public.maintenance_reset() from anon;

-- Do NOT grant to anyone via SQL — only service_role can call it
-- (service_role bypasses RLS and has access to all schemas by default in hosted Supabase)

commit;
