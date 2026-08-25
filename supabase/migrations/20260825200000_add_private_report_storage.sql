insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qa-reports', 'qa-reports', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy report_pdf_read on storage.objects
for select to authenticated
using (bucket_id = 'qa-reports' and (select private.current_user_role()) is not null);

create policy report_pdf_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'qa-reports' and (select private.has_role(array['ADMIN'::public.qa_role, 'QA_LEAD'::public.qa_role])));
