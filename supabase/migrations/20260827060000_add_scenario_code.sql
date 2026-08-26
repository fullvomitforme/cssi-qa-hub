-- Migration: Add scenario_code column to test_scenarios for stable catalog identifiers
-- scenario_code examples: QA-PORTAL-AUTH-001, QA-CRM-DASH-003

begin;

alter table public.test_scenarios add column scenario_code text;

-- Populate existing rows if any (none expected after reset, but safe)
-- update public.test_scenarios set scenario_code = 'LEGACY-' || id::text where scenario_code is null;

alter table public.test_scenarios alter column scenario_code set not null;
alter table public.test_scenarios add constraint test_scenarios_scenario_code_unique unique (scenario_code);

commit;
