create or replace function public.create_test_plan(
  target_name text,
  target_application_id uuid,
  target_release_id uuid,
  target_environment_id uuid,
  target_owner_id uuid,
  target_description text,
  target_start_date date,
  target_target_completion date,
  target_status public.plan_status,
  target_scenario_ids uuid[] default '{}'::uuid[],
  target_assignment_profile_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_plan_id uuid;
  scenario_id uuid;
  scenario_position integer := 0;
  assignment_profile_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if coalesce(array_length(target_scenario_ids, 1), 0) = 0 then
    raise exception 'At least one scenario is required' using errcode = '23514';
  end if;

  if coalesce(array_length(target_assignment_profile_ids, 1), 0) = 0 then
    raise exception 'At least one assignment is required' using errcode = '23514';
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

  perform 1
  from public.profiles profile
  where profile.id = target_owner_id
    and profile.status = 'ACTIVE'
    and profile.role = any (array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]);

  if not found then
    raise exception 'Invalid plan owner' using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(target_scenario_ids) as input_scenario(id)
    left join public.test_scenarios scenario
      on scenario.id = input_scenario.id
     and scenario.application_id = target_application_id
     and scenario.is_active
    where scenario.id is null
  ) then
    raise exception 'One or more scenarios are unavailable for this application'
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

  insert into public.test_plans (
    application_id,
    release_id,
    environment_id,
    name,
    description,
    owner_id,
    start_date,
    target_completion,
    status,
    created_by,
    updated_by
  )
  values (
    target_application_id,
    target_release_id,
    target_environment_id,
    btrim(target_name),
    coalesce(target_description, ''),
    target_owner_id,
    target_start_date,
    target_target_completion,
    target_status,
    actor_id,
    actor_id
  )
  returning id into new_plan_id;

  foreach scenario_id in array target_scenario_ids
  loop
    scenario_position := scenario_position + 1;

    insert into public.test_plan_items (
      test_plan_id,
      scenario_id,
      position,
      created_by
    )
    values (
      new_plan_id,
      scenario_id,
      scenario_position,
      actor_id
    );
  end loop;

  foreach assignment_profile_id in array target_assignment_profile_ids
  loop
    insert into public.test_plan_assignments (
      test_plan_id,
      profile_id,
      assigned_by
    )
    values (
      new_plan_id,
      assignment_profile_id,
      actor_id
    );
  end loop;

  return new_plan_id;
end;
$$;

create or replace function public.update_test_plan(
  target_plan_id uuid,
  target_name text,
  target_application_id uuid,
  target_release_id uuid,
  target_environment_id uuid,
  target_owner_id uuid,
  target_description text,
  target_start_date date,
  target_target_completion date,
  target_status public.plan_status,
  target_scenario_ids uuid[] default '{}'::uuid[],
  target_assignment_profile_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  scenario_id uuid;
  scenario_position integer := 0;
  assignment_profile_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if coalesce(array_length(target_scenario_ids, 1), 0) = 0 then
    raise exception 'At least one scenario is required' using errcode = '23514';
  end if;

  if coalesce(array_length(target_assignment_profile_ids, 1), 0) = 0 then
    raise exception 'At least one assignment is required' using errcode = '23514';
  end if;

  perform 1
  from public.test_plans plan
  where plan.id = target_plan_id;

  if not found then
    raise exception 'Test plan not found' using errcode = 'P0002';
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

  perform 1
  from public.profiles profile
  where profile.id = target_owner_id
    and profile.status = 'ACTIVE'
    and profile.role = any (array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]);

  if not found then
    raise exception 'Invalid plan owner' using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(target_scenario_ids) as input_scenario(id)
    left join public.test_scenarios scenario
      on scenario.id = input_scenario.id
     and scenario.application_id = target_application_id
     and scenario.is_active
    where scenario.id is null
  ) then
    raise exception 'One or more scenarios are unavailable for this application'
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

  update public.test_plans
  set
    application_id = target_application_id,
    release_id = target_release_id,
    environment_id = target_environment_id,
    name = btrim(target_name),
    description = coalesce(target_description, ''),
    owner_id = target_owner_id,
    start_date = target_start_date,
    target_completion = target_target_completion,
    status = target_status,
    updated_by = actor_id
  where id = target_plan_id;

  delete from public.test_plan_items
  where test_plan_id = target_plan_id;

  scenario_position := 0;
  foreach scenario_id in array target_scenario_ids
  loop
    scenario_position := scenario_position + 1;

    insert into public.test_plan_items (
      test_plan_id,
      scenario_id,
      position,
      created_by
    )
    values (
      target_plan_id,
      scenario_id,
      scenario_position,
      actor_id
    );
  end loop;

  delete from public.test_plan_assignments
  where test_plan_id = target_plan_id
    and not (profile_id = any(target_assignment_profile_ids));

  foreach assignment_profile_id in array target_assignment_profile_ids
  loop
    insert into public.test_plan_assignments (
      test_plan_id,
      profile_id,
      assigned_by
    )
    values (
      target_plan_id,
      assignment_profile_id,
      actor_id
    )
    on conflict (test_plan_id, profile_id) do nothing;
  end loop;

  return target_plan_id;
end;
$$;

revoke all on function public.create_test_plan(
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  date,
  date,
  public.plan_status,
  uuid[],
  uuid[]
) from public, anon, authenticated;
grant execute on function public.create_test_plan(
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  date,
  date,
  public.plan_status,
  uuid[],
  uuid[]
) to authenticated;

revoke all on function public.update_test_plan(
  uuid,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  date,
  date,
  public.plan_status,
  uuid[],
  uuid[]
) from public, anon, authenticated;
grant execute on function public.update_test_plan(
  uuid,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  date,
  date,
  public.plan_status,
  uuid[],
  uuid[]
) to authenticated;
