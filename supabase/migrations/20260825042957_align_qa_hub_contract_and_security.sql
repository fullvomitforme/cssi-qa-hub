-- Align the deployed schema with the approved frontend contract and the 2026
-- explicit Data API grant model. This migration is additive except for
-- tightening grants/policies that have not yet been deployed remotely.

alter type public.finding_status add value if not exists 'IN_REVIEW';
alter type public.finding_status add value if not exists 'LINKED';
alter type public.finding_status add value if not exists 'ANSWERED';
alter type public.finding_status add value if not exists 'FIXED';

do $$
begin
  create type public.environment_status as enum (
    'AVAILABLE',
    'MAINTENANCE',
    'RESTRICTED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.retest_status as enum (
    'NOT_REQUIRED',
    'AWAITING_FIX',
    'READY',
    'FAILED_AGAIN',
    'PASSED'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.environments
  add column if not exists base_url text,
  add column if not exists availability public.environment_status not null default 'AVAILABLE',
  add column if not exists last_checked_at timestamptz;

alter table public.failures
  alter column retest_status type public.retest_status
  using (
    case retest_status::text
      when 'PASS' then 'PASSED'
      when 'FAIL' then 'FAILED_AGAIN'
      when 'SKIPPED' then 'NOT_REQUIRED'
      when 'BLOCKED' then 'AWAITING_FIX'
      else 'AWAITING_FIX'
    end
  )::public.retest_status;

-- Data API privileges are explicit and intentionally omit anon, DELETE, and
-- internal report counter access. RLS remains the row-level authorization layer.
revoke all privileges on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;

grant select on table
  public.profiles,
  public.applications,
  public.modules,
  public.features,
  public.environments,
  public.releases,
  public.test_scenarios,
  public.test_steps,
  public.scenario_tags,
  public.test_plans,
  public.test_plan_items,
  public.test_plan_assignments,
  public.test_runs,
  public.test_run_assignments,
  public.test_executions,
  public.test_execution_steps,
  public.test_execution_attempts,
  public.qa_work_items,
  public.qa_work_item_assignments,
  public.qa_work_item_history,
  public.failures,
  public.feedback,
  public.attachments,
  public.comments,
  public.reports,
  public.report_snapshots,
  public.report_approvals,
  public.audit_events
to authenticated;

grant insert, update on table
  public.profiles,
  public.applications,
  public.modules,
  public.features,
  public.environments,
  public.releases,
  public.test_scenarios,
  public.test_steps,
  public.scenario_tags,
  public.test_plans,
  public.test_plan_items,
  public.test_plan_assignments,
  public.test_runs,
  public.test_run_assignments,
  public.qa_work_items,
  public.qa_work_item_assignments,
  public.test_executions,
  public.test_execution_steps,
  public.failures,
  public.feedback,
  public.comments,
  public.reports
to authenticated;

grant insert on table
  public.test_execution_attempts,
  public.qa_work_item_history,
  public.attachments,
  public.report_snapshots,
  public.report_approvals,
  public.audit_events
to authenticated;

alter policy profiles_read on public.profiles
using ((select private.current_user_role()) is not null);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'applications',
    'modules',
    'features',
    'environments',
    'releases',
    'test_scenarios',
    'test_steps',
    'scenario_tags',
    'test_plans',
    'test_plan_items',
    'test_plan_assignments',
    'test_runs',
    'test_run_assignments',
    'qa_work_items',
    'qa_work_item_assignments',
    'reports',
    'report_snapshots',
    'report_approvals'
  ]
  loop
    execute format(
      'alter policy %I_read on public.%I using ((select private.current_user_role()) is not null)',
      table_name,
      table_name
    );
  end loop;
end
$$;

alter policy history_read on public.qa_work_item_history
using ((select private.current_user_role()) is not null);
alter policy findings_read on public.failures
using ((select private.current_user_role()) is not null);
alter policy feedback_read on public.feedback
using ((select private.current_user_role()) is not null);
alter policy comments_read on public.comments
using ((select private.current_user_role()) is not null);

drop policy if exists report_number_counters_read on public.report_number_counters;
drop policy if exists report_number_counters_insert on public.report_number_counters;

-- A SECURITY DEFINER helper is kept private, checks the calling identity, and
-- returns only whether that caller may reach the supplied execution context.
create or replace function private.can_access_execution(
  target_execution_id uuid,
  target_application_id uuid,
  target_scenario_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.test_executions execution
      join public.test_runs run on run.id = execution.test_run_id
      where execution.id = target_execution_id
        and run.application_id = target_application_id
        and (target_scenario_id is null or execution.source_scenario_id = target_scenario_id)
        and (select private.can_execute_run(execution.test_run_id))
    );
$$;

revoke all on function private.can_access_execution(uuid, uuid, uuid)
from public, anon, authenticated, service_role;
grant execute on function private.can_access_execution(uuid, uuid, uuid)
to authenticated;

drop policy if exists execution_steps_write on public.test_execution_steps;
create policy execution_steps_insert
on public.test_execution_steps for insert to authenticated
with check (
  exists (
    select 1 from public.test_executions execution
    where execution.id = execution_id
      and (select private.can_execute_run(execution.test_run_id))
  )
);
create policy execution_steps_update
on public.test_execution_steps for update to authenticated
using (
  exists (
    select 1 from public.test_executions execution
    where execution.id = execution_id
      and (select private.can_execute_run(execution.test_run_id))
  )
)
with check (
  exists (
    select 1 from public.test_executions execution
    where execution.id = execution_id
      and (select private.can_execute_run(execution.test_run_id))
  )
);

drop policy if exists findings_insert on public.failures;
drop policy if exists findings_update on public.failures;
create policy findings_insert
on public.failures for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_execution(execution_id, application_id, null))
);
create policy findings_update
on public.failures for update to authenticated
using (
  (
    (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
    or created_by = (select auth.uid())
  )
  and (select private.can_access_execution(execution_id, application_id, null))
)
with check (
  (
    (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
    or created_by = (select auth.uid())
  )
  and (select private.can_access_execution(execution_id, application_id, null))
);

drop policy if exists feedback_insert on public.feedback;
drop policy if exists feedback_update on public.feedback;
create policy feedback_insert
on public.feedback for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_execution(execution_id, application_id, scenario_id))
);
create policy feedback_update
on public.feedback for update to authenticated
using (
  (
    (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
    or created_by = (select auth.uid())
  )
  and (select private.can_access_execution(execution_id, application_id, scenario_id))
)
with check (
  (
    (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
    or created_by = (select auth.uid())
  )
  and (select private.can_access_execution(execution_id, application_id, scenario_id))
);

drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert
on public.attachments for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.test_executions execution
    join public.test_runs run on run.id = execution.test_run_id
    where execution.id = attachments.execution_id
      and (select private.can_access_execution(execution.id, run.application_id, null))
  )
  and (
    failure_id is null
    or exists (
      select 1 from public.failures failure
      where failure.id = failure_id
        and failure.execution_id = attachments.execution_id
    )
  )
  and (
    feedback_id is null
    or exists (
      select 1 from public.feedback feedback_item
      where feedback_item.id = feedback_id
        and feedback_item.execution_id = attachments.execution_id
    )
  )
);

-- Index every foreign-key side that is not already covered by an existing
-- primary, unique, or composite index with the FK as its leading column.
create index if not exists applications_created_by_idx on public.applications(created_by);
create index if not exists applications_updated_by_idx on public.applications(updated_by);
create index if not exists modules_created_by_idx on public.modules(created_by);
create index if not exists modules_updated_by_idx on public.modules(updated_by);
create index if not exists features_created_by_idx on public.features(created_by);
create index if not exists features_updated_by_idx on public.features(updated_by);
create index if not exists environments_created_by_idx on public.environments(created_by);
create index if not exists environments_updated_by_idx on public.environments(updated_by);
create index if not exists releases_environment_id_idx on public.releases(environment_id);
create index if not exists releases_created_by_idx on public.releases(created_by);
create index if not exists releases_updated_by_idx on public.releases(updated_by);
create index if not exists test_scenarios_module_id_idx on public.test_scenarios(module_id);
create index if not exists test_scenarios_feature_id_idx on public.test_scenarios(feature_id);
create index if not exists test_scenarios_created_by_idx on public.test_scenarios(created_by);
create index if not exists test_scenarios_updated_by_idx on public.test_scenarios(updated_by);
create index if not exists test_steps_created_by_idx on public.test_steps(created_by);
create index if not exists scenario_tags_created_by_idx on public.scenario_tags(created_by);
create index if not exists test_plans_application_id_idx on public.test_plans(application_id);
create index if not exists test_plans_release_id_idx on public.test_plans(release_id);
create index if not exists test_plans_environment_id_idx on public.test_plans(environment_id);
create index if not exists test_plans_owner_id_idx on public.test_plans(owner_id);
create index if not exists test_plans_created_by_idx on public.test_plans(created_by);
create index if not exists test_plans_updated_by_idx on public.test_plans(updated_by);
create index if not exists test_plan_items_scenario_id_idx on public.test_plan_items(scenario_id);
create index if not exists test_plan_items_created_by_idx on public.test_plan_items(created_by);
create index if not exists test_plan_assignments_profile_id_idx on public.test_plan_assignments(profile_id);
create index if not exists test_plan_assignments_assigned_by_idx on public.test_plan_assignments(assigned_by);
create index if not exists test_runs_test_plan_id_idx on public.test_runs(test_plan_id);
create index if not exists test_runs_release_id_idx on public.test_runs(release_id);
create index if not exists test_runs_environment_id_idx on public.test_runs(environment_id);
create index if not exists test_runs_created_by_idx on public.test_runs(created_by);
create index if not exists test_runs_updated_by_idx on public.test_runs(updated_by);
create index if not exists test_run_assignments_assigned_by_idx on public.test_run_assignments(assigned_by);
create index if not exists test_executions_source_scenario_id_idx on public.test_executions(source_scenario_id);
create index if not exists test_executions_assigned_to_idx on public.test_executions(assigned_to);
create index if not exists test_executions_tested_by_idx on public.test_executions(tested_by);
create index if not exists test_executions_created_by_idx on public.test_executions(created_by);
create index if not exists test_executions_updated_by_idx on public.test_executions(updated_by);
create index if not exists test_execution_steps_source_step_id_idx on public.test_execution_steps(source_step_id);
create index if not exists test_execution_steps_tested_by_idx on public.test_execution_steps(tested_by);
create index if not exists test_execution_attempts_executed_by_idx on public.test_execution_attempts(executed_by);
create index if not exists test_execution_attempts_previous_attempt_id_idx on public.test_execution_attempts(previous_attempt_id);
create index if not exists qa_work_items_application_id_idx on public.qa_work_items(application_id);
create index if not exists qa_work_items_module_id_idx on public.qa_work_items(module_id);
create index if not exists qa_work_items_feature_id_idx on public.qa_work_items(feature_id);
create index if not exists qa_work_items_environment_id_idx on public.qa_work_items(environment_id);
create index if not exists qa_work_items_test_run_id_idx on public.qa_work_items(test_run_id);
create index if not exists qa_work_items_created_by_idx on public.qa_work_items(created_by);
create index if not exists qa_work_items_updated_by_idx on public.qa_work_items(updated_by);
create index if not exists qa_work_item_assignments_assigned_by_idx on public.qa_work_item_assignments(assigned_by);
create index if not exists qa_work_item_history_changed_by_idx on public.qa_work_item_history(changed_by);
create index if not exists failures_execution_id_idx on public.failures(execution_id);
create index if not exists failures_attempt_id_idx on public.failures(attempt_id);
create index if not exists failures_created_by_idx on public.failures(created_by);
create index if not exists failures_resolved_by_idx on public.failures(resolved_by);
create index if not exists feedback_execution_id_idx on public.feedback(execution_id);
create index if not exists feedback_scenario_id_idx on public.feedback(scenario_id);
create index if not exists feedback_created_by_idx on public.feedback(created_by);
create index if not exists attachments_attempt_id_idx on public.attachments(attempt_id);
create index if not exists attachments_failure_id_idx on public.attachments(failure_id);
create index if not exists attachments_feedback_id_idx on public.attachments(feedback_id);
create index if not exists attachments_uploaded_by_idx on public.attachments(uploaded_by);
create index if not exists comments_created_by_idx on public.comments(created_by);
create index if not exists reports_application_id_idx on public.reports(application_id);
create index if not exists reports_created_by_idx on public.reports(created_by);
create index if not exists reports_finalized_by_idx on public.reports(finalized_by);
create index if not exists report_snapshots_test_run_id_idx on public.report_snapshots(test_run_id);
create index if not exists report_snapshots_generated_by_idx on public.report_snapshots(generated_by);
create index if not exists report_approvals_approved_by_idx on public.report_approvals(approved_by);
