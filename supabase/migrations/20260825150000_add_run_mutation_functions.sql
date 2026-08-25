create or replace function public.create_test_run(
  target_name text,
  target_test_plan_id uuid,
  target_application_id uuid,
  target_release_id uuid,
  target_environment_id uuid,
  target_build text,
  target_status public.run_status,
  target_assignment_profile_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_run_id uuid;
  assignment_profile_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if coalesce(array_length(target_assignment_profile_ids, 1), 0) = 0 then
    raise exception 'At least one assignment is required' using errcode = '23514';
  end if;

  perform 1
  from public.test_plans plan
  where plan.id = target_test_plan_id
    and plan.application_id = target_application_id;

  if not found then
    raise exception 'Test plan does not match the selected application'
      using errcode = '23503';
  end if;

  perform 1
  from public.releases release
  where release.id = target_release_id
    and release.application_id = target_application_id
    and release.environment_id = target_environment_id;

  if not found then
    raise exception 'Release does not match the selected application/environment'
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.test_plan_items plan_item
    where plan_item.test_plan_id = target_test_plan_id
  ) then
    raise exception 'The selected test plan has no scenarios'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(target_assignment_profile_ids) as input_profile(id)
    left join public.profiles profile
      on profile.id = input_profile.id
     and profile.status = 'ACTIVE'
     and profile.role = any (array['QA_LEAD'::public.qa_role, 'QA_TESTER'::public.qa_role])
    where profile.id is null
  ) then
    raise exception 'One or more assignees are invalid'
      using errcode = '23503';
  end if;

  insert into public.test_runs (
    test_plan_id,
    application_id,
    release_id,
    environment_id,
    name,
    build,
    status,
    started_at,
    completed_at,
    created_by,
    updated_by
  )
  values (
    target_test_plan_id,
    target_application_id,
    target_release_id,
    target_environment_id,
    btrim(target_name),
    btrim(target_build),
    target_status,
    case
      when target_status = 'NOT_STARTED' then null
      else now()
    end,
    case
      when target_status in ('COMPLETED', 'CANCELLED') then now()
      else null
    end,
    actor_id,
    actor_id
  )
  returning id into new_run_id;

  foreach assignment_profile_id in array target_assignment_profile_ids
  loop
    insert into public.test_run_assignments (
      test_run_id,
      profile_id,
      assigned_by
    )
    values (
      new_run_id,
      assignment_profile_id,
      actor_id
    );
  end loop;

  with scenario_snapshots as (
    select
      plan_item.position as plan_position,
      scenario.id as source_scenario_id,
      scenario.title as scenario_title,
      scenario.description as scenario_description,
      scenario.preconditions as scenario_preconditions,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'sourceStepId', step.id,
              'position', step.position,
              'instruction', step.instruction,
              'expectedResult', step.expected_result
            )
            order by step.position
          )
          from public.test_steps step
          where step.scenario_id = scenario.id
        ),
        '[]'::jsonb
      ) as scenario_steps,
      scenario.expected_result as scenario_expected_result,
      scenario.priority as scenario_priority,
      scenario.test_type as scenario_type
    from public.test_plan_items plan_item
    join public.test_scenarios scenario on scenario.id = plan_item.scenario_id
    where plan_item.test_plan_id = target_test_plan_id
    order by plan_item.position
  ),
  inserted_executions as (
    insert into public.test_executions (
      test_run_id,
      source_scenario_id,
      scenario_title,
      scenario_description,
      scenario_preconditions,
      scenario_steps,
      scenario_expected_result,
      scenario_priority,
      scenario_type,
      status,
      created_by,
      updated_by
    )
    select
      new_run_id,
      snapshot.source_scenario_id,
      snapshot.scenario_title,
      snapshot.scenario_description,
      snapshot.scenario_preconditions,
      snapshot.scenario_steps,
      snapshot.scenario_expected_result,
      snapshot.scenario_priority,
      snapshot.scenario_type,
      'NOT_TESTED'::public.execution_status,
      actor_id,
      actor_id
    from scenario_snapshots snapshot
    returning id, source_scenario_id
  )
  insert into public.test_execution_steps (
    execution_id,
    source_step_id,
    position,
    instruction,
    expected_result
  )
  select
    inserted_execution.id,
    step.id,
    step.position,
    step.instruction,
    step.expected_result
  from inserted_executions inserted_execution
  join public.test_steps step
    on step.scenario_id = inserted_execution.source_scenario_id
  order by inserted_execution.id, step.position;

  return new_run_id;
end;
$$;

create or replace function public.update_test_run(
  target_run_id uuid,
  target_name text,
  target_release_id uuid,
  target_environment_id uuid,
  target_build text,
  target_status public.run_status,
  target_assignment_profile_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  run_application_id uuid;
  assignment_profile_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if coalesce(array_length(target_assignment_profile_ids, 1), 0) = 0 then
    raise exception 'At least one assignment is required' using errcode = '23514';
  end if;

  select run.application_id
  into run_application_id
  from public.test_runs run
  where run.id = target_run_id;

  if run_application_id is null then
    raise exception 'Test run not found' using errcode = 'P0002';
  end if;

  perform 1
  from public.releases release
  where release.id = target_release_id
    and release.application_id = run_application_id
    and release.environment_id = target_environment_id;

  if not found then
    raise exception 'Release does not match the selected application/environment'
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(target_assignment_profile_ids) as input_profile(id)
    left join public.profiles profile
      on profile.id = input_profile.id
     and profile.status = 'ACTIVE'
     and profile.role = any (array['QA_LEAD'::public.qa_role, 'QA_TESTER'::public.qa_role])
    where profile.id is null
  ) then
    raise exception 'One or more assignees are invalid'
      using errcode = '23503';
  end if;

  update public.test_runs
  set
    release_id = target_release_id,
    environment_id = target_environment_id,
    name = btrim(target_name),
    build = btrim(target_build),
    status = target_status,
    started_at = case
      when target_status = 'NOT_STARTED' then null
      else coalesce(started_at, now())
    end,
    completed_at = case
      when target_status in ('COMPLETED', 'CANCELLED') then coalesce(completed_at, now())
      else null
    end,
    updated_by = actor_id
  where id = target_run_id;

  delete from public.test_run_assignments
  where test_run_id = target_run_id
    and not (profile_id = any(target_assignment_profile_ids));

  foreach assignment_profile_id in array target_assignment_profile_ids
  loop
    insert into public.test_run_assignments (
      test_run_id,
      profile_id,
      assigned_by
    )
    values (
      target_run_id,
      assignment_profile_id,
      actor_id
    )
    on conflict (test_run_id, profile_id) do nothing;
  end loop;

  return target_run_id;
end;
$$;

revoke all on function public.create_test_run(
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.run_status,
  uuid[]
) from public, anon, authenticated;
grant execute on function public.create_test_run(
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.run_status,
  uuid[]
) to authenticated;

revoke all on function public.update_test_run(
  uuid,
  text,
  uuid,
  uuid,
  text,
  public.run_status,
  uuid[]
) from public, anon, authenticated;
grant execute on function public.update_test_run(
  uuid,
  text,
  uuid,
  uuid,
  text,
  public.run_status,
  uuid[]
) to authenticated;
