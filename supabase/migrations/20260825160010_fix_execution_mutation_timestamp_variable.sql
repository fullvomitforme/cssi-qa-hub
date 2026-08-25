begin;

create or replace function public.record_test_execution(
  target_execution_id uuid,
  target_status public.execution_status,
  target_actual_result text default null,
  target_failure_reason text default null,
  target_severity public.severity default null,
  target_bug_reference text default null,
  target_steps jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  execution_row public.test_executions%rowtype;
  run_row public.test_runs%rowtype;
  current_timestamp_value timestamptz := now();
  normalized_actual_result text := nullif(trim(coalesce(target_actual_result, '')), '');
  normalized_failure_reason text := nullif(trim(coalesce(target_failure_reason, '')), '');
  normalized_bug_reference text := nullif(trim(coalesce(target_bug_reference, '')), '');
  latest_attempt_id uuid;
  next_attempt_number integer := 1;
  expected_step_count integer := 0;
  submitted_step_count integer := 0;
  invalid_step_count integer := 0;
begin
  if actor_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if target_status = 'NOT_TESTED' then
    raise exception 'Execution status must be pass, fail, blocked, or skipped.'
      using errcode = 'P0001';
  end if;

  if jsonb_typeof(coalesce(target_steps, '[]'::jsonb)) <> 'array' then
    raise exception 'Execution steps payload must be an array.'
      using errcode = 'P0001';
  end if;

  if target_status = 'FAIL'
    and (
      normalized_actual_result is null
      or normalized_failure_reason is null
      or target_severity is null
    ) then
    raise exception 'Failed executions require actual result, failure reason, and severity.'
      using errcode = 'P0001';
  end if;

  if target_status <> 'FAIL' then
    normalized_failure_reason := null;
    target_severity := null;
    normalized_bug_reference := null;
  end if;

  select *
  into execution_row
  from public.test_executions
  where id = target_execution_id;

  if not found then
    raise exception 'Execution not found.'
      using errcode = 'P0001';
  end if;

  select *
  into run_row
  from public.test_runs
  where id = execution_row.test_run_id;

  if not coalesce((select private.can_execute_run(run_row.id)), false) then
    raise exception 'You do not have permission to update this execution.'
      using errcode = '42501';
  end if;

  select count(*)
  into expected_step_count
  from public.test_execution_steps
  where execution_id = target_execution_id;

  select jsonb_array_length(coalesce(target_steps, '[]'::jsonb))
  into submitted_step_count;

  if expected_step_count <> submitted_step_count then
    raise exception 'All execution steps must be submitted when recording a result.'
      using errcode = 'P0001';
  end if;

  with submitted_steps as (
    select step.id
    from jsonb_to_recordset(target_steps) as step(
      id uuid,
      status public.step_status,
      actual_result text
    )
  )
  select count(*)
  into invalid_step_count
  from submitted_steps submitted
  left join public.test_execution_steps execution_step
    on execution_step.id = submitted.id
   and execution_step.execution_id = target_execution_id
  where execution_step.id is null;

  if invalid_step_count > 0 then
    raise exception 'One or more execution steps are invalid for this execution.'
      using errcode = 'P0001';
  end if;

  select attempt.id, attempt.attempt_number + 1
  into latest_attempt_id, next_attempt_number
  from public.test_execution_attempts attempt
  where attempt.execution_id = target_execution_id
  order by attempt.attempt_number desc
  limit 1;

  insert into public.test_execution_attempts (
    execution_id,
    attempt_number,
    status,
    build,
    actual_result,
    failure_reason,
    severity,
    bug_reference,
    executed_by,
    executed_at,
    previous_attempt_id
  )
  values (
    target_execution_id,
    next_attempt_number,
    target_status,
    run_row.build,
    normalized_actual_result,
    normalized_failure_reason,
    target_severity,
    normalized_bug_reference,
    actor_id,
    current_timestamp_value,
    latest_attempt_id
  );

  update public.test_executions
  set status = target_status,
      actual_result = normalized_actual_result,
      failure_reason = normalized_failure_reason,
      severity = target_severity,
      bug_reference = normalized_bug_reference,
      tested_by = actor_id,
      tested_at = current_timestamp_value,
      updated_by = actor_id,
      updated_at = current_timestamp_value
  where id = target_execution_id;

  with submitted_steps as (
    select
      step.id,
      step.status,
      nullif(trim(coalesce(step.actual_result, '')), '') as actual_result
    from jsonb_to_recordset(target_steps) as step(
      id uuid,
      status public.step_status,
      actual_result text
    )
  )
  update public.test_execution_steps execution_step
  set status = submitted.status,
      actual_result = case
        when submitted.status is null then null
        else submitted.actual_result
      end,
      tested_by = case
        when submitted.status is null then null
        else actor_id
      end,
      tested_at = case
        when submitted.status is null then null
        else current_timestamp_value
      end,
      updated_at = current_timestamp_value
  from submitted_steps submitted
  where execution_step.id = submitted.id
    and execution_step.execution_id = target_execution_id;

  if run_row.status = 'NOT_STARTED' then
    update public.test_runs
    set status = 'IN_PROGRESS',
        started_at = coalesce(started_at, current_timestamp_value),
        updated_by = actor_id,
        updated_at = current_timestamp_value
    where id = run_row.id;
  end if;

  return target_execution_id;
end;
$$;

commit;
