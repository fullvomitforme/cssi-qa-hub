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
    scenario.id,
    scenario.title,
    scenario.description,
    scenario.preconditions,
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
    ),
    scenario.expected_result,
    scenario.priority,
    scenario.test_type,
    'NOT_TESTED'::public.execution_status,
    actor_id,
    actor_id
  from public.test_plan_items plan_item
  join public.test_scenarios scenario on scenario.id = plan_item.scenario_id
  where plan_item.test_plan_id = target_test_plan_id
  order by plan_item.position;

  insert into public.test_execution_steps (
    execution_id,
    source_step_id,
    position,
    instruction,
    expected_result
  )
  select
    execution.id,
    step.id,
    step.position,
    step.instruction,
    step.expected_result
  from public.test_executions execution
  join public.test_steps step
    on step.scenario_id = execution.source_scenario_id
  where execution.test_run_id = new_run_id
  order by execution.created_at, step.position;

  return new_run_id;
end;
$$;
