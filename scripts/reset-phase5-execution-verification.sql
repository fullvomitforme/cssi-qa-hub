delete from public.test_execution_attempts
where execution_id in (
  select execution.id
  from public.test_executions execution
  join public.test_runs run
    on run.id = execution.test_run_id
  where run.name like 'Phase 5 RLS %'
);

delete from public.test_execution_steps
where execution_id in (
  select execution.id
  from public.test_executions execution
  join public.test_runs run
    on run.id = execution.test_run_id
  where run.name like 'Phase 5 RLS %'
);

delete from public.test_executions
where test_run_id in (
  select id
  from public.test_runs
  where name like 'Phase 5 RLS %'
);

delete from public.test_run_assignments
where test_run_id in (
  select id
  from public.test_runs
  where name like 'Phase 5 RLS %'
);

delete from public.test_runs
where name like 'Phase 5 RLS %';
