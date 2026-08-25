-- Temporary hosted identities for Phase 1 auth and RLS verification.
-- Passwords are exercised by scripts/verify-phase1-rls.ts.

delete from public.profiles
where id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000005'
);

delete from auth.identities
where user_id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005'
);

delete from auth.users
where id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005'
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
    '30000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase1.admin@localhost.com',
    crypt('QaHubPhase1!Admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 1 Admin"}',
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
    '30000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase1.lead@localhost.com',
    crypt('QaHubPhase1!Lead', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 1 Lead"}',
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
    '30000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'phase1.tester@localhost.com',
    crypt('QaHubPhase1!Tester', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 1 Tester"}',
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
    '30000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'phase1.missing@localhost.com',
    crypt('QaHubPhase1!Missing', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 1 Missing Profile"}',
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
    '30000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'phase1.inactive@localhost.com',
    crypt('QaHubPhase1!Inactive', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 1 Inactive"}',
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
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'phase1.admin@localhost.com',
    '{"sub":"30000000-0000-4000-8000-000000000001","email":"phase1.admin@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'phase1.lead@localhost.com',
    '{"sub":"30000000-0000-4000-8000-000000000002","email":"phase1.lead@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    'phase1.tester@localhost.com',
    '{"sub":"30000000-0000-4000-8000-000000000003","email":"phase1.tester@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000004',
    'phase1.missing@localhost.com',
    '{"sub":"30000000-0000-4000-8000-000000000004","email":"phase1.missing@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000005',
    'phase1.inactive@localhost.com',
    '{"sub":"30000000-0000-4000-8000-000000000005","email":"phase1.inactive@localhost.com","email_verified":true}',
    'email',
    now(),
    now()
  );

insert into public.profiles (id, email, full_name, role, status)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'phase1.admin@localhost.com',
    'Phase 1 Admin',
    'ADMIN',
    'ACTIVE'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'phase1.lead@localhost.com',
    'Phase 1 Lead',
    'QA_LEAD',
    'ACTIVE'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'phase1.tester@localhost.com',
    'Phase 1 Tester',
    'QA_TESTER',
    'ACTIVE'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    'phase1.inactive@localhost.com',
    'Phase 1 Inactive',
    'QA_TESTER',
    'INACTIVE'
  );
