-- Minimal hosted reference hierarchy and starter scenarios for Scenario integration.
-- Intended for the linked development project, not production seeding.

insert into public.modules (
  id,
  application_id,
  name,
  slug,
  description,
  created_by,
  updated_by
)
values
  (
    '23000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    'Authentication',
    'authentication',
    'Portal authentication workflows',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '23000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000002',
    'Contacts',
    'contacts',
    'CRM contact management',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '23000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000003',
    'Opening Account',
    'opening-account',
    'Flowra account opening workflow',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  )
on conflict (application_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_by = excluded.updated_by;

insert into public.features (
  id,
  module_id,
  name,
  slug,
  description,
  created_by,
  updated_by
)
values
  (
    '24000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    'Login',
    'login',
    'Portal login experience',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '24000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000002',
    'Create Contact',
    'create-contact',
    'CRM create contact flow',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '24000000-0000-4000-8000-000000000003',
    '23000000-0000-4000-8000-000000000003',
    'Personal Information',
    'personal-information',
    'Flowra personal information collection',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  )
on conflict (module_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_by = excluded.updated_by;

delete from public.scenario_tags
where scenario_id in (
  '25000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000002',
  '25000000-0000-4000-8000-000000000003'
);

delete from public.test_steps
where scenario_id in (
  '25000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000002',
  '25000000-0000-4000-8000-000000000003'
);

delete from public.test_scenarios
where id in (
  '25000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000002',
  '25000000-0000-4000-8000-000000000003'
);

insert into public.test_scenarios (
  id,
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
values
  (
    '25000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    '24000000-0000-4000-8000-000000000001',
    'Login with valid credentials',
    'Verify an active Portal user can sign in successfully.',
    'A QA user account exists and is ACTIVE.',
    'HAPPY_PATH',
    'P1',
    'Overview opens and the authenticated session is established.',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000002',
    '24000000-0000-4000-8000-000000000002',
    'Create contact with required fields',
    'Verify CRM saves a new contact when required fields are valid.',
    'CRM user is signed in and has create-contact permission.',
    'REGRESSION',
    'P2',
    'The new contact record is saved and visible in the CRM list.',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000003',
    '23000000-0000-4000-8000-000000000003',
    '24000000-0000-4000-8000-000000000003',
    'Save personal information with complete data',
    'Verify Flowra accepts valid personal information during account opening.',
    'Tester is on the personal information step of the account-opening flow.',
    'HAPPY_PATH',
    'P2',
    'The flow advances to the next step with the saved data.',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001'
  );

insert into public.test_steps (
  scenario_id,
  position,
  instruction,
  expected_result,
  created_by
)
values
  (
    '25000000-0000-4000-8000-000000000001',
    1,
    'Open the Portal login page.',
    'The login form is visible.',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000001',
    2,
    'Enter a valid email address and password, then submit.',
    'The user is signed in successfully.',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    1,
    'Open CRM Contacts and click Create Contact.',
    'The create-contact form is displayed.',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    2,
    'Populate all required fields and save the form.',
    'The record is saved without validation errors.',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    1,
    'Complete the required personal-information fields.',
    'All required fields accept valid values.',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    2,
    'Submit the form to continue the opening-account flow.',
    'The workflow advances to the next step.',
    '31000000-0000-4000-8000-000000000001'
  );

insert into public.scenario_tags (scenario_id, tag, created_by)
values
  (
    '25000000-0000-4000-8000-000000000001',
    'auth',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000001',
    'smoke',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    'contacts',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    'regression',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    'flowra',
    '31000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    'smoke',
    '31000000-0000-4000-8000-000000000001'
  );
