create or replace function public.next_report_number(
  target_application_id uuid,
  target_year integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_slug text;
  next_number integer;
begin
  if not (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])) then
    raise exception 'Only QA administrators and leads can allocate report numbers' using errcode = '42501';
  end if;

  select slug into application_slug
  from public.applications
  where id = target_application_id;
  if application_slug is null then
    raise exception 'Application does not exist' using errcode = '22023';
  end if;

  insert into public.report_number_counters(application_id, report_year, last_number)
  values (target_application_id, target_year, 1)
  on conflict (application_id, report_year)
  do update set last_number = public.report_number_counters.last_number + 1
  returning last_number into next_number;

  return format('QA-%s-%s-%s', upper(application_slug), target_year, lpad(next_number::text, 4, '0'));
end;
$$;

revoke all on function public.next_report_number(uuid, integer) from public, anon, authenticated;
grant execute on function public.next_report_number(uuid, integer) to authenticated;
