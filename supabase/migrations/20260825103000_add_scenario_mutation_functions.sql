create or replace function public.create_test_scenario(
  target_application_id uuid,
  target_module_id uuid,
  target_feature_id uuid,
  target_title text,
  target_description text,
  target_preconditions text,
  target_test_type public.test_type,
  target_priority public.priority,
  target_expected_result text,
  target_steps jsonb default '[]'::jsonb,
  target_tags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_scenario_id uuid;
  step_value jsonb;
  step_position integer := 0;
  normalized_tags text[];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if jsonb_typeof(target_steps) <> 'array' or jsonb_array_length(target_steps) = 0 then
    raise exception 'At least one step is required' using errcode = '23514';
  end if;

  perform 1
  from public.modules module
  join public.features feature
    on feature.id = target_feature_id
   and feature.module_id = module.id
   and feature.is_active
  join public.applications application
    on application.id = module.application_id
   and application.is_active
  where module.id = target_module_id
    and module.application_id = target_application_id
    and module.is_active;

  if not found then
    raise exception 'Invalid application/module/feature selection' using errcode = '23503';
  end if;

  insert into public.test_scenarios (
    application_id,
    module_id,
    feature_id,
    title,
    description,
    preconditions,
    test_type,
    priority,
    expected_result,
    created_by,
    updated_by
  )
  values (
    target_application_id,
    target_module_id,
    target_feature_id,
    btrim(target_title),
    target_description,
    target_preconditions,
    target_test_type,
    target_priority,
    target_expected_result,
    actor_id,
    actor_id
  )
  returning id into new_scenario_id;

  for step_value in select value from jsonb_array_elements(target_steps)
  loop
    step_position := step_position + 1;

    insert into public.test_steps (
      scenario_id,
      position,
      instruction,
      expected_result,
      created_by
    )
    values (
      new_scenario_id,
      step_position,
      btrim(step_value->>'instruction'),
      nullif(btrim(coalesce(step_value->>'expected_result', '')), ''),
      actor_id
    );
  end loop;

  normalized_tags := array(
    select distinct lower(btrim(tag))
    from unnest(coalesce(target_tags, '{}'::text[])) as tag
    where btrim(tag) <> ''
    order by 1
  );

  if coalesce(array_length(normalized_tags, 1), 0) > 0 then
    insert into public.scenario_tags (scenario_id, tag, created_by)
    select new_scenario_id, tag, actor_id
    from unnest(normalized_tags) as tag;
  end if;

  return new_scenario_id;
end;
$$;

create or replace function public.update_test_scenario(
  target_scenario_id uuid,
  target_application_id uuid,
  target_module_id uuid,
  target_feature_id uuid,
  target_title text,
  target_description text,
  target_preconditions text,
  target_test_type public.test_type,
  target_priority public.priority,
  target_expected_result text,
  target_steps jsonb default '[]'::jsonb,
  target_tags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  step_value jsonb;
  step_position integer := 0;
  retained_step_ids uuid[];
  normalized_tags text[];
  step_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  if jsonb_typeof(target_steps) <> 'array' or jsonb_array_length(target_steps) = 0 then
    raise exception 'At least one step is required' using errcode = '23514';
  end if;

  perform 1
  from public.test_scenarios scenario
  where scenario.id = target_scenario_id
    and scenario.is_active;

  if not found then
    raise exception 'Scenario not found' using errcode = 'P0002';
  end if;

  perform 1
  from public.modules module
  join public.features feature
    on feature.id = target_feature_id
   and feature.module_id = module.id
   and feature.is_active
  join public.applications application
    on application.id = module.application_id
   and application.is_active
  where module.id = target_module_id
    and module.application_id = target_application_id
    and module.is_active;

  if not found then
    raise exception 'Invalid application/module/feature selection' using errcode = '23503';
  end if;

  update public.test_scenarios
  set
    application_id = target_application_id,
    module_id = target_module_id,
    feature_id = target_feature_id,
    title = btrim(target_title),
    description = target_description,
    preconditions = target_preconditions,
    test_type = target_test_type,
    priority = target_priority,
    expected_result = target_expected_result,
    updated_by = actor_id
  where id = target_scenario_id;

  retained_step_ids := array(
    select (value->>'id')::uuid
    from jsonb_array_elements(target_steps) as value
    where coalesce(value->>'id', '') <> ''
  );

  update public.test_steps
  set position = position + 1000
  where scenario_id = target_scenario_id
    and id = any(coalesce(retained_step_ids, '{}'::uuid[]));

  delete from public.test_steps
  where scenario_id = target_scenario_id
    and not (id = any(coalesce(retained_step_ids, '{}'::uuid[])));

  for step_value in select value from jsonb_array_elements(target_steps)
  loop
    step_position := step_position + 1;
    step_id := nullif(step_value->>'id', '')::uuid;

    if step_id is null then
      insert into public.test_steps (
        scenario_id,
        position,
        instruction,
        expected_result,
        created_by
      )
      values (
        target_scenario_id,
        step_position,
        btrim(step_value->>'instruction'),
        nullif(btrim(coalesce(step_value->>'expected_result', '')), ''),
        actor_id
      );
    else
      update public.test_steps
      set
        position = step_position,
        instruction = btrim(step_value->>'instruction'),
        expected_result = nullif(btrim(coalesce(step_value->>'expected_result', '')), '')
      where id = step_id
        and scenario_id = target_scenario_id;

      if not found then
        raise exception 'Invalid scenario step' using errcode = '23503';
      end if;
    end if;
  end loop;

  normalized_tags := array(
    select distinct lower(btrim(tag))
    from unnest(coalesce(target_tags, '{}'::text[])) as tag
    where btrim(tag) <> ''
    order by 1
  );

  delete from public.scenario_tags
  where scenario_id = target_scenario_id
    and not (tag = any(coalesce(normalized_tags, '{}'::text[])));

  if coalesce(array_length(normalized_tags, 1), 0) > 0 then
    insert into public.scenario_tags (scenario_id, tag, created_by)
    select target_scenario_id, tag, actor_id
    from unnest(normalized_tags) as tag
    on conflict (scenario_id, tag) do nothing;
  end if;

  return target_scenario_id;
end;
$$;

revoke all on function public.create_test_scenario(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.test_type,
  public.priority,
  text,
  jsonb,
  text[]
) from public, anon, authenticated;
grant execute on function public.create_test_scenario(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.test_type,
  public.priority,
  text,
  jsonb,
  text[]
) to authenticated;

revoke all on function public.update_test_scenario(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.test_type,
  public.priority,
  text,
  jsonb,
  text[]
) from public, anon, authenticated;
grant execute on function public.update_test_scenario(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.test_type,
  public.priority,
  text,
  jsonb,
  text[]
) to authenticated;
