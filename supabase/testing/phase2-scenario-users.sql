-- Hosted verification identities for Scenario integration.
-- These remain clearly named so real role/RLS checks can be repeated.

delete from public.profiles
where id in (
  '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000002',
  '31000000-0000-4000-8000-000000000003'
);

delete from auth.identities
where user_id in (
  '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000002',
  '31000000-0000-4000-8000-000000000003'
);

delete from auth.users
where id in (
  '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000002',
  '31000000-0000-4000-8000-000000000003'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  is_sso_user,
  is_anonymous
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '31000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase2.admin@localhost.com',
    crypt('QaHubPhase2!Admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 2 Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '31000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase2.lead@localhost.com',
    crypt('QaHubPhase2!Lead', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 2 Lead"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '31000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'phase2.tester@localhost.com',
    crypt('QaHubPhase2!Tester', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 2 Tester"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'phase2.admin@localhost.com',
    '{"sub":"31000000-0000-4000-8000-000000000001","email":"phase2.admin@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002',
    'phase2.lead@localhost.com',
    '{"sub":"31000000-0000-4000-8000-000000000002","email":"phase2.lead@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003',
    'phase2.tester@localhost.com',
    '{"sub":"31000000-0000-4000-8000-000000000003","email":"phase2.tester@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  );

insert into public.profiles (id, email, full_name, role, status)
values
  (
    '31000000-0000-4000-8000-000000000001',
    'phase2.admin@localhost.com',
    'Phase 2 Admin',
    'ADMIN',
    'ACTIVE'
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    'phase2.lead@localhost.com',
    'Phase 2 Lead',
    'QA_LEAD',
    'ACTIVE'
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    'phase2.tester@localhost.com',
    'Phase 2 Tester',
    'QA_TESTER',
    'ACTIVE'
  );
