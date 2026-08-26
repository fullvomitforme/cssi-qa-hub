-- Migration: Complete workspace reset with correct FK order
-- This function drops immutable triggers, clears data in correct order, then recreates triggers

begin;

-- Drop existing function if it exists
drop function if exists public.maintenance_reset();

-- Create the reset function entirely in public schema
create or replace function public.maintenance_reset()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Drop the immutable triggers temporarily
  drop trigger if exists immutable_report_snapshots on public.report_snapshots;
  drop trigger if exists immutable_report_approvals on public.report_approvals;
  drop trigger if exists immutable_audit_events on public.audit_events;
  drop trigger if exists immutable_work_history on public.qa_work_item_history;
  drop trigger if exists immutable_attempts on public.test_execution_attempts;

  -- Delete data in FK-safe order (from leaf tables up to root tables)
  delete from public.report_approvals where true;
  delete from public.report_snapshots where true;
  delete from public.audit_events where true;
  delete from public.reports where true;
  delete from public.attachments where true;
  delete from public.comments where true;
  delete from public.feedback where true;
  delete from public.failures where true;
  delete from public.qa_work_item_history where true;
  delete from public.qa_work_item_assignments where true;
  delete from public.qa_work_items where true;
  delete from public.test_execution_attempts where true;
  delete from public.test_execution_steps where true;
  delete from public.test_executions where true;
  delete from public.test_run_assignments where true;
  delete from public.test_runs where true;
  delete from public.test_plan_assignments where true;
  delete from public.test_plan_items where true;
  delete from public.test_plans where true;
  delete from public.test_steps where true;
  delete from public.scenario_tags where true;
  delete from public.test_scenarios where true;
  delete from public.features where true;
  delete from public.modules where true;
  delete from public.report_number_counters where true;
  delete from public.releases where true;
  delete from public.environments where true;
  delete from public.test_plan_assignments where true;

  -- Recreate the immutable triggers
  create trigger immutable_report_snapshots before update or delete on public.report_snapshots for each row execute function private.reject_immutable_change();
  create trigger immutable_report_approvals before update or delete on public.report_approvals for each row execute function private.reject_immutable_change();
  create trigger immutable_audit_events before update or delete on public.audit_events for each row execute function private.reject_immutable_change();
  create trigger immutable_work_history before update or delete on public.qa_work_item_history for each row execute function private.reject_immutable_change();
  create trigger immutable_attempts before update or delete on public.test_execution_attempts for each row execute function private.reject_immutable_change();
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.maintenance_reset() to authenticated;

commit;
