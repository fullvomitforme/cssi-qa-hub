begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create schema if not exists private;

create type public.qa_role as enum ('ADMIN', 'QA_LEAD', 'QA_TESTER');
create type public.profile_status as enum ('ACTIVE', 'INACTIVE');
create type public.priority as enum ('P0', 'P1', 'P2', 'P3');
create type public.test_type as enum ('HAPPY_PATH', 'VALIDATION', 'NEGATIVE', 'PERMISSION', 'EDGE_CASE', 'INTEGRATION', 'REGRESSION', 'RESPONSIVE', 'ACCESSIBILITY', 'PERFORMANCE');
create type public.plan_status as enum ('DRAFT', 'READY', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
create type public.run_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');
create type public.execution_status as enum ('NOT_TESTED', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED');
create type public.step_status as enum ('PASS', 'FAIL', 'SKIPPED');
create type public.work_item_status as enum ('BACKLOG', 'READY_TO_TEST', 'IN_TESTING', 'BLOCKED', 'FAILED_NEED_FIX', 'RETEST', 'PASSED', 'DONE');
create type public.severity as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
create type public.feedback_type as enum ('BUG', 'UX', 'COPY', 'IMPROVEMENT', 'QUESTION');
create type public.finding_status as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX');
create type public.release_status as enum ('PLANNED', 'TESTING', 'QA_APPROVED', 'REJECTED', 'RELEASED', 'ARCHIVED');
create type public.report_result as enum ('PASS', 'CONDITIONAL_PASS', 'FAIL');
create type public.report_status as enum ('DRAFT', 'FINALIZED');
create type public.approval_kind as enum ('PREPARED_BY', 'REVIEWED_BY', 'APPROVED_BY');
create type public.comment_subject as enum ('EXECUTION', 'FAILURE', 'FEEDBACK', 'WORK_ITEM', 'REPORT');

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.reject_immutable_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '55000';
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  full_name text not null check (length(trim(full_name)) > 0),
  role public.qa_role not null default 'QA_TESTER',
  status public.profile_status not null default 'ACTIVE',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug = lower(slug)),
  description text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  name text not null, slug text not null check (slug = lower(slug)), description text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete restrict, updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(application_id, slug)
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete restrict,
  name text not null, slug text not null check (slug = lower(slug)), description text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete restrict, updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(module_id, slug)
);

create table public.environments (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique check (slug = lower(slug)),
  description text not null default '', is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete restrict, updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.releases (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  environment_id uuid not null references public.environments(id) on delete restrict,
  version text not null, build text not null, branch text, commit_sha text,
  release_date date, status public.release_status not null default 'PLANNED',
  created_by uuid references public.profiles(id) on delete restrict, updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(application_id, environment_id, version, build)
);

create table public.test_scenarios (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  module_id uuid not null references public.modules(id) on delete restrict, feature_id uuid not null references public.features(id) on delete restrict,
  title text not null check (length(trim(title)) > 0), description text not null default '', preconditions text not null default '',
  test_type public.test_type not null, priority public.priority not null default 'P2', expected_result text not null,
  is_active boolean not null default true,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(preconditions, '') || ' ' || coalesce(expected_result, ''))) stored,
  created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.test_steps (
  id uuid primary key default gen_random_uuid(), scenario_id uuid not null references public.test_scenarios(id) on delete cascade,
  position integer not null check (position > 0), instruction text not null, expected_result text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(scenario_id, position)
);

create table public.scenario_tags (
  scenario_id uuid not null references public.test_scenarios(id) on delete cascade,
  tag text not null check (tag = lower(tag) and length(tag) between 1 and 40),
  created_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(),
  primary key (scenario_id, tag)
);

create table public.test_plans (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  release_id uuid not null references public.releases(id) on delete restrict, environment_id uuid not null references public.environments(id) on delete restrict,
  name text not null, description text not null default '', owner_id uuid not null references public.profiles(id) on delete restrict,
  start_date date, target_completion date, status public.plan_status not null default 'DRAFT',
  created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.test_plan_items (
  id uuid primary key default gen_random_uuid(), test_plan_id uuid not null references public.test_plans(id) on delete cascade,
  scenario_id uuid not null references public.test_scenarios(id) on delete restrict, position integer not null check (position > 0),
  created_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(),
  unique(test_plan_id, scenario_id), unique(test_plan_id, position)
);

create table public.test_plan_assignments (
  test_plan_id uuid not null references public.test_plans(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict, assigned_at timestamptz not null default now(),
  primary key(test_plan_id, profile_id)
);

create table public.test_runs (
  id uuid primary key default gen_random_uuid(), test_plan_id uuid not null references public.test_plans(id) on delete restrict,
  application_id uuid not null references public.applications(id) on delete restrict, release_id uuid not null references public.releases(id) on delete restrict,
  environment_id uuid not null references public.environments(id) on delete restrict, name text not null, build text not null,
  status public.run_status not null default 'NOT_STARTED', started_at timestamptz, completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.test_run_assignments (
  test_run_id uuid not null references public.test_runs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict, assigned_at timestamptz not null default now(),
  primary key(test_run_id, profile_id)
);

create table public.test_executions (
  id uuid primary key default gen_random_uuid(), test_run_id uuid not null references public.test_runs(id) on delete restrict,
  source_scenario_id uuid not null references public.test_scenarios(id) on delete restrict,
  scenario_title text not null, scenario_description text not null, scenario_preconditions text not null,
  scenario_steps jsonb not null check (jsonb_typeof(scenario_steps) = 'array'), scenario_expected_result text not null,
  scenario_priority public.priority not null, scenario_type public.test_type not null,
  status public.execution_status not null default 'NOT_TESTED', assigned_to uuid references public.profiles(id) on delete restrict,
  actual_result text, failure_reason text, severity public.severity, bug_reference text, tested_by uuid references public.profiles(id) on delete restrict, tested_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(test_run_id, source_scenario_id),
  constraint failed_execution_requires_detail check (status <> 'FAIL' or (length(trim(coalesce(actual_result, ''))) > 0 and length(trim(coalesce(failure_reason, ''))) > 0 and severity is not null))
);

create table public.test_execution_steps (
  id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.test_executions(id) on delete restrict,
  source_step_id uuid references public.test_steps(id) on delete restrict, position integer not null check (position > 0),
  instruction text not null, expected_result text, status public.step_status, actual_result text,
  tested_by uuid references public.profiles(id) on delete restrict, tested_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(execution_id, position)
);

create table public.test_execution_attempts (
  id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.test_executions(id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0), status public.execution_status not null check (status <> 'NOT_TESTED'),
  build text not null, actual_result text, failure_reason text, severity public.severity, bug_reference text,
  executed_by uuid not null references public.profiles(id) on delete restrict, executed_at timestamptz not null default now(),
  previous_attempt_id uuid references public.test_execution_attempts(id) on delete restrict, created_at timestamptz not null default now(),
  unique(execution_id, attempt_number),
  constraint failed_attempt_requires_detail check (status <> 'FAIL' or (length(trim(coalesce(actual_result, ''))) > 0 and length(trim(coalesce(failure_reason, ''))) > 0 and severity is not null))
);

create table public.qa_work_items (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  module_id uuid references public.modules(id) on delete restrict, feature_id uuid references public.features(id) on delete restrict,
  release_id uuid not null references public.releases(id) on delete restrict, environment_id uuid not null references public.environments(id) on delete restrict,
  test_run_id uuid references public.test_runs(id) on delete restrict, title text not null, description text not null default '',
  priority public.priority not null default 'P2', status public.work_item_status not null default 'BACKLOG', due_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.qa_work_item_assignments (
  work_item_id uuid not null references public.qa_work_items(id) on delete cascade, profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict, assigned_at timestamptz not null default now(), primary key(work_item_id, profile_id)
);

create table public.qa_work_item_history (
  id uuid primary key default gen_random_uuid(), work_item_id uuid not null references public.qa_work_items(id) on delete restrict,
  from_status public.work_item_status, to_status public.work_item_status not null, reason text, fix_build text,
  changed_by uuid not null references public.profiles(id) on delete restrict, changed_at timestamptz not null default now(),
  previous_value jsonb, new_value jsonb not null
);

create table public.failures (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  execution_id uuid not null references public.test_executions(id) on delete restrict, attempt_id uuid references public.test_execution_attempts(id) on delete restrict,
  severity public.severity not null, status public.finding_status not null default 'OPEN', title text not null, description text not null,
  bug_reference text, retest_status public.execution_status, created_by uuid not null references public.profiles(id) on delete restrict,
  resolved_by uuid references public.profiles(id) on delete restrict, resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete restrict,
  execution_id uuid not null references public.test_executions(id) on delete restrict, scenario_id uuid not null references public.test_scenarios(id) on delete restrict,
  feedback_type public.feedback_type not null, title text not null, description text not null, severity public.severity,
  status public.finding_status not null default 'OPEN', created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.test_executions(id) on delete restrict,
  attempt_id uuid references public.test_execution_attempts(id) on delete restrict, failure_id uuid references public.failures(id) on delete restrict,
  feedback_id uuid references public.feedback(id) on delete restrict, storage_path text not null unique, filename text not null,
  mime_type text not null, size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  uploaded_by uuid not null references public.profiles(id) on delete restrict, uploaded_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(), subject_type public.comment_subject not null, subject_id uuid not null,
  body text not null check (length(trim(body)) > 0), created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), test_run_id uuid not null references public.test_runs(id) on delete restrict,
  application_id uuid not null references public.applications(id) on delete restrict, report_number text unique,
  status public.report_status not null default 'DRAFT', result public.report_result, conclusion text,
  created_by uuid not null references public.profiles(id) on delete restrict, finalized_by uuid references public.profiles(id) on delete restrict,
  finalized_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(test_run_id)
);

create table public.report_number_counters (
  application_id uuid not null references public.applications(id) on delete restrict, report_year integer not null,
  last_number integer not null default 0 check (last_number >= 0), primary key(application_id, report_year)
);

create table public.report_snapshots (
  id uuid primary key default gen_random_uuid(), report_id uuid not null unique references public.reports(id) on delete restrict,
  test_run_id uuid not null references public.test_runs(id) on delete restrict, report_number text not null unique,
  snapshot_json jsonb not null check (jsonb_typeof(snapshot_json) = 'object'), generated_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default now(), pdf_storage_path text not null, pdf_sha256 text not null check (length(pdf_sha256) = 64)
);

create table public.report_approvals (
  id uuid primary key default gen_random_uuid(), report_id uuid not null references public.reports(id) on delete restrict,
  approval_kind public.approval_kind not null, approved_by uuid not null references public.profiles(id) on delete restrict,
  approver_role public.qa_role not null, approved_at timestamptz not null default now(), remarks text, unique(report_id, approval_kind)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null, entity_type text not null, entity_id uuid not null, previous_value jsonb, new_value jsonb,
  occurred_at timestamptz not null default now(), request_id uuid
);

create index test_scenarios_search_idx on public.test_scenarios using gin(search_vector);
create index test_scenarios_filters_idx on public.test_scenarios(application_id, module_id, feature_id, test_type, priority) where is_active;
create index scenario_tags_tag_idx on public.scenario_tags(tag);
create index releases_filter_idx on public.releases(application_id, environment_id, status, release_date desc);
create index runs_filter_idx on public.test_runs(application_id, release_id, environment_id, status, created_at desc);
create index executions_run_status_idx on public.test_executions(test_run_id, status);
create index execution_attempts_history_idx on public.test_execution_attempts(execution_id, attempt_number desc);
create index work_items_board_idx on public.qa_work_items(release_id, status, priority, due_at);
create index work_item_history_idx on public.qa_work_item_history(work_item_id, changed_at desc);
create index failures_filter_idx on public.failures(application_id, status, severity, created_at desc);
create index feedback_filter_idx on public.feedback(application_id, status, feedback_type, created_at desc);
create index attachments_execution_idx on public.attachments(execution_id, uploaded_at desc);
create index comments_subject_idx on public.comments(subject_type, subject_id, created_at);
create index audit_entity_idx on public.audit_events(entity_type, entity_id, occurred_at desc);
create index audit_actor_idx on public.audit_events(actor_id, occurred_at desc);
create index run_assignments_profile_idx on public.test_run_assignments(profile_id, test_run_id);
create index work_assignments_profile_idx on public.qa_work_item_assignments(profile_id, work_item_id);

create function private.current_user_role()
returns public.qa_role language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.status = 'ACTIVE';
$$;

create function private.has_role(allowed public.qa_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.current_user_role()) = any(allowed);
$$;

create function private.can_execute_run(target_run_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
    or exists (
      select 1 from public.test_run_assignments a
      where a.test_run_id = target_run_id and a.profile_id = (select auth.uid())
    );
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.has_role(public.qa_role[]) to authenticated;
grant execute on function private.can_execute_run(uuid) to authenticated;

create function private.guard_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role and not (select private.has_role(array['ADMIN'::public.qa_role])) then
    raise exception 'Only ADMIN may change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_profile_role() from public, anon, authenticated;

create trigger profiles_role_guard before update on public.profiles for each row execute function private.guard_profile_role();

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','applications','modules','features','environments','releases','test_scenarios','test_steps','test_plans','test_runs','test_executions','test_execution_steps','qa_work_items','failures','feedback','comments','reports']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create trigger immutable_attempts before update or delete on public.test_execution_attempts for each row execute function private.reject_immutable_change();
create trigger immutable_work_history before update or delete on public.qa_work_item_history for each row execute function private.reject_immutable_change();
create trigger immutable_report_snapshots before update or delete on public.report_snapshots for each row execute function private.reject_immutable_change();
create trigger immutable_report_approvals before update or delete on public.report_approvals for each row execute function private.reject_immutable_change();
create trigger immutable_audit_events before update or delete on public.audit_events for each row execute function private.reject_immutable_change();

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','applications','modules','features','environments','releases','test_scenarios','test_steps','scenario_tags','test_plans','test_plan_items','test_plan_assignments','test_runs','test_run_assignments','test_executions','test_execution_steps','test_execution_attempts','qa_work_items','qa_work_item_assignments','qa_work_item_history','failures','feedback','attachments','comments','reports','report_number_counters','report_snapshots','report_approvals','audit_events']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.applications, public.modules, public.features, public.environments, public.releases, public.profiles to authenticated;
grant insert, update, delete on public.test_scenarios, public.test_steps, public.scenario_tags, public.test_plans, public.test_plan_items, public.test_plan_assignments, public.test_runs, public.test_run_assignments, public.qa_work_items, public.qa_work_item_assignments to authenticated;
grant insert, update on public.test_executions, public.test_execution_steps, public.failures, public.feedback, public.comments to authenticated;
grant insert on public.test_execution_attempts, public.qa_work_item_history, public.attachments, public.audit_events to authenticated;
grant insert, update on public.reports to authenticated;
grant insert on public.report_snapshots, public.report_approvals, public.report_number_counters to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_admin_insert on public.profiles for insert to authenticated with check ((select private.has_role(array['ADMIN'::public.qa_role])));
create policy profiles_admin_update on public.profiles for update to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role]))) with check ((select private.has_role(array['ADMIN'::public.qa_role])));
create policy profiles_admin_delete on public.profiles for delete to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role])));

do $$
declare table_name text;
begin
  foreach table_name in array array['applications','modules','features','environments','releases'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', table_name, table_name);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check ((select private.has_role(array[''ADMIN''::public.qa_role])))', table_name, table_name);
    execute format('create policy %I_update on public.%I for update to authenticated using ((select private.has_role(array[''ADMIN''::public.qa_role]))) with check ((select private.has_role(array[''ADMIN''::public.qa_role])))', table_name, table_name);
    execute format('create policy %I_delete on public.%I for delete to authenticated using ((select private.has_role(array[''ADMIN''::public.qa_role])))', table_name, table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['test_scenarios','test_steps','scenario_tags','test_plans','test_plan_items','test_plan_assignments','test_runs','test_run_assignments','qa_work_items','qa_work_item_assignments'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', table_name, table_name);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check ((select private.has_role(array[''ADMIN''::public.qa_role, ''QA_LEAD''::public.qa_role])))', table_name, table_name);
    execute format('create policy %I_update on public.%I for update to authenticated using ((select private.has_role(array[''ADMIN''::public.qa_role, ''QA_LEAD''::public.qa_role]))) with check ((select private.has_role(array[''ADMIN''::public.qa_role, ''QA_LEAD''::public.qa_role])))', table_name, table_name);
    execute format('create policy %I_delete on public.%I for delete to authenticated using ((select private.has_role(array[''ADMIN''::public.qa_role, ''QA_LEAD''::public.qa_role])))', table_name, table_name);
  end loop;
end $$;

create policy executions_read on public.test_executions for select to authenticated using ((select private.can_execute_run(test_run_id)));
create policy executions_insert on public.test_executions for insert to authenticated with check ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])));
create policy executions_update on public.test_executions for update to authenticated using ((select private.can_execute_run(test_run_id))) with check ((select private.can_execute_run(test_run_id)));
create policy execution_steps_read on public.test_execution_steps for select to authenticated using (exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));
create policy execution_steps_write on public.test_execution_steps for all to authenticated using (exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id)))) with check (exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));
create policy attempts_read on public.test_execution_attempts for select to authenticated using (exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));
create policy attempts_insert on public.test_execution_attempts for insert to authenticated with check (executed_by = (select auth.uid()) and exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));

create policy history_read on public.qa_work_item_history for select to authenticated using (true);
create policy history_insert on public.qa_work_item_history for insert to authenticated with check (changed_by = (select auth.uid()) and (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])));
create policy findings_read on public.failures for select to authenticated using (true);
create policy findings_insert on public.failures for insert to authenticated with check (created_by = (select auth.uid()));
create policy findings_update on public.failures for update to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) or created_by = (select auth.uid())) with check ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) or created_by = (select auth.uid()));
create policy feedback_read on public.feedback for select to authenticated using (true);
create policy feedback_insert on public.feedback for insert to authenticated with check (created_by = (select auth.uid()));
create policy feedback_update on public.feedback for update to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) or created_by = (select auth.uid())) with check ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) or created_by = (select auth.uid()));
create policy attachments_read on public.attachments for select to authenticated using (exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));
create policy attachments_insert on public.attachments for insert to authenticated with check (uploaded_by = (select auth.uid()) and exists(select 1 from public.test_executions e where e.id = execution_id and (select private.can_execute_run(e.test_run_id))));
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check (created_by = (select auth.uid()));
create policy comments_update on public.comments for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));

do $$
declare table_name text;
begin
  foreach table_name in array array['reports','report_number_counters','report_snapshots','report_approvals'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', table_name, table_name);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check ((select private.has_role(array[''ADMIN''::public.qa_role, ''QA_LEAD''::public.qa_role])))', table_name, table_name);
  end loop;
end $$;
create policy reports_update on public.reports for update to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))) with check ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])));
create policy audit_read on public.audit_events for select to authenticated using ((select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) or actor_id = (select auth.uid()));
create policy audit_insert on public.audit_events for insert to authenticated with check (actor_id = (select auth.uid()));

create function public.get_overview_dashboard()
returns jsonb language sql stable security invoker set search_path = '' as $$
with summary as (
  select
    (select count(*) from public.test_scenarios where is_active) as total,
    count(*) filter (where status <> 'NOT_TESTED') as tested,
    count(*) filter (where status = 'PASS') as passed,
    count(*) filter (where status = 'FAIL') as failed,
    count(*) filter (where status = 'BLOCKED') as blocked,
    count(*) filter (where status = 'SKIPPED') as skipped,
    count(*) filter (where status = 'NOT_TESTED') as not_tested
  from public.test_executions
), application_rows as (
  select
    a.name,
    a.slug,
    case when count(distinct s.id) = 0 then 0 else round(100.0 * count(distinct e.source_scenario_id) filter (where e.status <> 'NOT_TESTED') / count(distinct s.id), 1) end as coverage,
    case when count(e.id) filter (where e.status <> 'NOT_TESTED') = 0 then 0 else round(100.0 * count(e.id) filter (where e.status = 'PASS') / count(e.id) filter (where e.status <> 'NOT_TESTED'), 1) end as pass_rate,
    count(e.id) filter (where e.status = 'FAIL') as failed,
    count(e.id) filter (where e.status = 'BLOCKED') as blocked,
    greatest(count(distinct s.id) - count(distinct e.source_scenario_id) filter (where e.status <> 'NOT_TESTED'), 0) as not_tested
  from public.applications a
  left join public.test_scenarios s on s.application_id = a.id and s.is_active
  left join public.test_executions e on e.source_scenario_id = s.id
  where a.is_active
  group by a.id, a.name, a.slug
), application_data as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'application', name,
    'slug', slug,
    'coverage', coverage,
    'passRate', pass_rate,
    'failed', failed,
    'blocked', blocked,
    'notTested', not_tested
  ) order by name), '[]'::jsonb) as data
  from application_rows
), recent_runs as (
  select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) as data from (
    select r.created_at, jsonb_build_object(
      'id', r.id, 'name', r.name, 'environment', env.name, 'build', r.build, 'status', r.status,
      'progress', case when count(e.id) = 0 then 0 else round(100.0 * count(e.id) filter (where e.status <> 'NOT_TESTED') / count(e.id), 0) end
    ) as row_data
    from public.test_runs r join public.environments env on env.id = r.environment_id
    left join public.test_executions e on e.test_run_id = r.id
    group by r.id, env.name order by r.created_at desc limit 5
  ) rows
), top_failures as (
  select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) as data from (
    select f.created_at, jsonb_build_object(
      'id', f.id, 'scenario', e.scenario_title, 'application', a.name, 'severity', f.severity,
      'bugReference', coalesce(f.bug_reference, '—'), 'foundBy', p.full_name,
      'foundAt', to_char(f.created_at at time zone 'Asia/Bangkok', 'DD Mon YYYY HH24:MI')
    ) as row_data
    from public.failures f join public.test_executions e on e.id = f.execution_id
    join public.applications a on a.id = f.application_id join public.profiles p on p.id = f.created_by
    where f.status in ('OPEN','IN_PROGRESS') order by f.created_at desc limit 5
  ) rows
), trend as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'date', to_char(days.day, 'Mon DD'), 'passed', coalesce(x.passed, 0),
    'failed', coalesce(x.failed, 0), 'blocked', coalesce(x.blocked, 0)
  ) order by days.day), '[]'::jsonb) as data
  from generate_series(current_date - 6, current_date, interval '1 day') days(day)
  left join (
    select tested_at::date as day, count(*) filter (where status = 'PASS') as passed,
      count(*) filter (where status = 'FAIL') as failed, count(*) filter (where status = 'BLOCKED') as blocked
    from public.test_executions where tested_at >= current_date - 6 group by tested_at::date
  ) x on x.day = days.day::date
)
select jsonb_build_object(
  'metrics', jsonb_build_array(
    jsonb_build_object('label','Total Scenarios','value',s.total,'context','Reusable definitions','tone','default'),
    jsonb_build_object('label','Tested','value',s.tested,'context',case when s.total = 0 then '0% coverage' else round(100.0*s.tested/s.total,1)::text || '% coverage' end,'tone','success'),
    jsonb_build_object('label','Passed','value',s.passed,'context',case when s.tested = 0 then '0% pass rate' else round(100.0*s.passed/s.tested,1)::text || '% pass rate' end,'tone','success'),
    jsonb_build_object('label','Failed','value',s.failed,'context','Requires action','tone','destructive'),
    jsonb_build_object('label','Blocked','value',s.blocked,'context','Waiting on dependency','tone','warning'),
    jsonb_build_object('label','Not Tested','value',greatest(s.total-s.tested,0),'context','Remaining coverage','tone','neutral')
  ),
  'applications', ad.data,
  'distribution', jsonb_build_array(
    jsonb_build_object('status','PASS','count',s.passed,'percentage',case when s.tested=0 then 0 else round(100.0*s.passed/s.tested,1) end),
    jsonb_build_object('status','FAIL','count',s.failed,'percentage',case when s.tested=0 then 0 else round(100.0*s.failed/s.tested,1) end),
    jsonb_build_object('status','BLOCKED','count',s.blocked,'percentage',case when s.tested=0 then 0 else round(100.0*s.blocked/s.tested,1) end),
    jsonb_build_object('status','SKIPPED','count',s.skipped,'percentage',case when s.tested=0 then 0 else round(100.0*s.skipped/s.tested,1) end)
  ),
  'trend', t.data, 'recentRuns', rr.data, 'topFailures', tf.data
)
from summary s cross join application_data ad cross join recent_runs rr cross join top_failures tf cross join trend t;
$$;

revoke all on function public.get_overview_dashboard() from public, anon;
grant execute on function public.get_overview_dashboard() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qa-evidence', 'qa-evidence', false, 52428800, array['image/png','image/jpeg','image/webp','application/pdf','text/plain','text/csv','application/json','video/mp4'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_read on storage.objects for select to authenticated using (bucket_id = 'qa-evidence' and exists(select 1 from public.attachments a join public.test_executions e on e.id = a.execution_id where a.storage_path = name and (select private.can_execute_run(e.test_run_id))));
create policy evidence_insert on storage.objects for insert to authenticated with check (bucket_id = 'qa-evidence' and (storage.foldername(name))[1] is not null and exists(select 1 from public.test_executions e where e.id::text = (storage.foldername(name))[1] and (select private.can_execute_run(e.test_run_id))));
create policy evidence_update on storage.objects for update to authenticated using (bucket_id = 'qa-evidence' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'qa-evidence' and owner_id = (select auth.uid()::text));
create policy evidence_delete on storage.objects for delete to authenticated using (bucket_id = 'qa-evidence' and (owner_id = (select auth.uid()::text) or (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))));

commit;
