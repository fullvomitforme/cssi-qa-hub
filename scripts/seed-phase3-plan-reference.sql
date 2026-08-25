insert into public.releases (
  application_id,
  environment_id,
  version,
  build,
  branch,
  commit_sha,
  release_date,
  status,
  created_by,
  updated_by
)
select
  application.id,
  environment.id,
  'v1.10.0',
  'phase3-verification',
  'phase3/test-plans',
  'phase3verify',
  date '2026-08-25',
  'TESTING'::public.release_status,
  profile.id,
  profile.id
from public.applications application
join public.environments environment
  on environment.slug = 'uat'
join public.profiles profile
  on profile.email = 'phase2.admin@localhost.com'
where application.slug = 'portal'
  and not exists (
    select 1
    from public.releases release
    where release.application_id = application.id
      and release.environment_id = environment.id
      and release.version = 'v1.10.0'
      and release.build = 'phase3-verification'
  );
