begin;

grant delete on table public.attachments to authenticated;

create policy attachments_delete
on public.attachments for delete to authenticated
using (
  (
    uploaded_by = (select auth.uid())
    or (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role]))
  )
  and exists (
    select 1
    from public.test_executions execution
    join public.test_runs run
      on run.id = execution.test_run_id
    where execution.id = attachments.execution_id
      and (select private.can_access_execution(execution.id, run.application_id, null))
  )
);

commit;
