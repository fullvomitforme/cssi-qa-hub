-- Extend get_overview_dashboard() with optional filters
-- Filters: release_id, environment_id, start_date, end_date

create or replace function public.get_overview_dashboard(
  filter_release_id uuid default null,
  filter_environment_id uuid default null,
  filter_start_date date default null,
  filter_end_date date default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
with
exec_filter as (
  select id, test_run_id, source_scenario_id, status, tested_at
  from public.test_executions e
  where
    (filter_release_id is null or e.test_run_id in (
      select tr.id from public.test_runs tr
      join public.releases r on r.id = tr.release_id
      where r.id = filter_release_id
    ))
    and (filter_environment_id is null or exists (
      select 1 from public.test_runs tr
      where tr.id = e.test_run_id and tr.environment_id = filter_environment_id
    ))
    and (filter_start_date is null or e.tested_at >= filter_start_date)
    and (filter_end_date is null or e.tested_at < filter_end_date + interval '1 day')
),
summary as (
  select
    (select count(*) from public.test_scenarios s where s.is_active) as total,
    count(*) filter (where ef.status <> 'NOT_TESTED') as tested,
    count(*) filter (where ef.status = 'PASS') as passed,
    count(*) filter (where ef.status = 'FAIL') as failed,
    count(*) filter (where ef.status = 'BLOCKED') as blocked,
    count(*) filter (where ef.status = 'SKIPPED') as skipped,
    count(*) filter (where ef.status = 'NOT_TESTED') as not_tested
  from exec_filter ef
), application_rows as (
  select
    a.name,
    a.slug,
    case when count(distinct s.id) = 0 then 0 else round(100.0 * count(distinct ef.source_scenario_id) filter (where ef.status <> 'NOT_TESTED') / nullif(count(distinct s.id), 0), 1) end as coverage,
    case when count(ef.id) filter (where ef.status <> 'NOT_TESTED') = 0 then 0 else round(100.0 * count(ef.id) filter (where ef.status = 'PASS') / nullif(count(ef.id) filter (where ef.status <> 'NOT_TESTED'), 0), 1) end as pass_rate,
    count(ef.id) filter (where ef.status = 'FAIL') as failed,
    count(ef.id) filter (where ef.status = 'BLOCKED') as blocked,
    greatest(count(distinct s.id) - count(distinct ef.source_scenario_id) filter (where ef.status <> 'NOT_TESTED'), 0) as not_tested
  from public.applications a
  left join public.test_scenarios s on s.application_id = a.id and s.is_active
  left join exec_filter ef on ef.source_scenario_id = s.id
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
      'progress', case when count(ef.id) = 0 then 0 else round(100.0 * count(ef.id) filter (where ef.status <> 'NOT_TESTED') / nullif(count(ef.id), 0), 0) end
    ) as row_data
    from public.test_runs r
    join public.environments env on env.id = r.environment_id
    left join exec_filter ef on ef.test_run_id = r.id
    where (filter_release_id is null or r.release_id = filter_release_id)
      and (filter_environment_id is null or r.environment_id = filter_environment_id)
    group by r.id, env.name
    order by r.created_at desc
    limit 5
  ) rows
), top_failures as (
  select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) as data from (
    select f.created_at, jsonb_build_object(
      'id', f.id, 'scenario', e.scenario_title, 'application', a.name, 'severity', f.severity,
      'bugReference', coalesce(f.bug_reference, '—'), 'foundBy', p.full_name,
      'foundAt', to_char(f.created_at at time zone 'Asia/Bangkok', 'DD Mon YYYY HH24:MI')
    ) as row_data
    from public.failures f
    join exec_filter e on e.id = f.execution_id
    join public.applications a on a.id = f.application_id
    join public.profiles p on p.id = f.created_by
    where f.status in ('OPEN','IN_PROGRESS')
    order by f.created_at desc
    limit 5
  ) rows
), trend as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'date', to_char(days.day, 'Mon DD'), 'passed', coalesce(x.passed, 0),
    'failed', coalesce(x.failed, 0), 'blocked', coalesce(x.blocked, 0)
  ) order by days.day), '[]'::jsonb) as data
  from generate_series(
    coalesce(filter_start_date, current_date - 6),
    coalesce(filter_end_date, current_date),
    interval '1 day'
  ) days(day)
  left join (
    select tested_at::date as day,
      count(*) filter (where status = 'PASS') as passed,
      count(*) filter (where status = 'FAIL') as failed,
      count(*) filter (where status = 'BLOCKED') as blocked
    from exec_filter
    group by tested_at::date
  ) x on x.day = days.day::date
)
select jsonb_build_object(
  'metrics', jsonb_build_array(
    jsonb_build_object('label','Total Scenarios','value',s.total,'context','Reusable definitions','tone','default'),
    jsonb_build_object('label','Tested','value',s.tested,'context',case when s.total = 0 then '0% coverage' else round(100.0*s.tested/nullif(s.total,0),1)::text || '% coverage' end,'tone','success'),
    jsonb_build_object('label','Passed','value',s.passed,'context',case when s.tested = 0 then '0% pass rate' else round(100.0*s.passed/nullif(s.tested,0),1)::text || '% pass rate' end,'tone','success'),
    jsonb_build_object('label','Failed','value',s.failed,'context','Requires action','tone','destructive'),
    jsonb_build_object('label','Blocked','value',s.blocked,'context','Waiting on dependency','tone','warning'),
    jsonb_build_object('label','Not Tested','value',greatest(s.total-s.tested,0),'context','Remaining coverage','tone','neutral')
  ),
  'applications', ad.data,
  'distribution', jsonb_build_array(
    jsonb_build_object('status','PASS','count',s.passed,'percentage',case when s.tested=0 then 0 else round(100.0*s.passed/nullif(s.tested,0),1) end),
    jsonb_build_object('status','FAIL','count',s.failed,'percentage',case when s.tested=0 then 0 else round(100.0*s.failed/nullif(s.tested,0),1) end),
    jsonb_build_object('status','BLOCKED','count',s.blocked,'percentage',case when s.tested=0 then 0 else round(100.0*s.blocked/nullif(s.tested,0),1) end),
    jsonb_build_object('status','SKIPPED','count',s.skipped,'percentage',case when s.tested=0 then 0 else round(100.0*s.skipped/nullif(s.tested,0),1) end)
  ),
  'trend', t.data, 'recentRuns', rr.data, 'topFailures', tf.data
)
from summary s cross join application_data ad cross join recent_runs rr cross join top_failures tf cross join trend t;
$$;

revoke all on function public.get_overview_dashboard(uuid, uuid, date, date) from public, anon, authenticated;
grant execute on function public.get_overview_dashboard(uuid, uuid, date, date) to authenticated;
