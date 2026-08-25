-- Phase 1 reference bootstrap for hosted QA Hub.
-- Intentionally limited to stable reference rows required by auth-adjacent UI.

insert into public.applications (id, name, slug, description)
values
  ('21000000-0000-4000-8000-000000000001', 'Portal', 'portal', 'Central authentication and navigation hub'),
  ('21000000-0000-4000-8000-000000000002', 'CRM', 'crm', 'Sales and trading platform'),
  ('21000000-0000-4000-8000-000000000003', 'Flowra', 'flowra', 'Account-opening workflow automation'),
  ('21000000-0000-4000-8000-000000000004', 'Daily Operation', 'daily-operation', 'Daily operational task tracking'),
  ('21000000-0000-4000-8000-000000000005', 'ITQM', 'itqm', 'IT quality management'),
  ('21000000-0000-4000-8000-000000000006', 'Intranet', 'intranet', 'Internal employee portal')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.environments (
  id,
  name,
  slug,
  description,
  base_url,
  availability,
  last_checked_at
)
values
  ('22000000-0000-4000-8000-000000000001', 'Local', 'local', 'Developer workstation', null, 'AVAILABLE', null),
  ('22000000-0000-4000-8000-000000000002', 'Development', 'development', 'Shared development environment', null, 'AVAILABLE', null),
  ('22000000-0000-4000-8000-000000000003', 'UAT', 'uat', 'User acceptance testing', null, 'AVAILABLE', null),
  ('22000000-0000-4000-8000-000000000004', 'Staging', 'staging', 'Release candidate staging', null, 'MAINTENANCE', null),
  ('22000000-0000-4000-8000-000000000005', 'Production', 'production', 'Production environment', null, 'RESTRICTED', null)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  base_url = excluded.base_url,
  availability = excluded.availability,
  last_checked_at = excluded.last_checked_at;
