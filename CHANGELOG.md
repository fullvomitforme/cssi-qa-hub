# Changelog

All notable changes to CSSI QA Hub will be documented in this file.

## [Unreleased]

### Added

- **Manual QA Scenario Catalogs** — Source-of-truth Markdown catalogs for all six CSSI applications (330 scenarios across Portal, CRM, Flowra, Daily Operation, ITQM, Intranet). Each catalog includes:
  - Business-readable scenario steps and expected results
  - Stable scenario IDs (`QA-<APP>-<MODULE>-<NNN>`)
  - Priority classification (Critical / High / Medium / Low)
  - Category classification (Happy Path / Validation / Permission / Negative / Edge Case / Integration)
  - Implementation Status per module (READY / LIMITED / MOCK / STUB)
  - Coverage gaps and known limitations
- **QA Catalog Review Report** — `docs/qa-scenarios/REVIEW.md` documenting the review pass: priority normalization, technical term removal, missing Category sections fixed, intranet catalog created (was missing from initial generation)
- **README with lifecycle statuses** — DRAFT → REVIEWED → READY FOR IMPORT progression for each application catalog

### Changed

- **Scenario ID integrity verified** — No duplicate IDs across all 330 scenarios
- **Priority distribution normalized** — Critical reserved for auth failures, security bypasses, and destructive workflow blockers; 22 permission-denial scenarios demoted from Critical to High
- **Technical terminology removed** — Module codes (`IT_CHECK_DAILY`, `FLOWRA_OA_PROCESS`, `ITQM_DEVELOPMENT`, etc.) replaced with user-friendly descriptions in preconditions and steps
- **Missing Category sections added** — 9 scenarios across Portal, CRM, Flowra, Daily Operation, and ITQM now have proper Category fields
- **Implementation Status metadata added** — Each catalog documents READY / LIMITED / MOCK / STUB features so QA testers know what is executable

### Security

- No changes to existing security posture

---

## [Operational Ready] - 2026-08-25

### Added

#### Core Features

- **Supabase SSR Authentication** — Full auth integration with cookie-based sessions
- **Role/Profile Admission** — Three-tier RBAC (ADMIN, QA_LEAD, QA_TESTER) with profile verification
- **Reference Data Persistence** — Applications, modules, features, environments, releases stored in PostgreSQL
- **Scenario Persistence** — Full CRUD with steps, tags, and full-text search
- **Plan Persistence** — Test plans with scenario selection and tester assignments
- **Run Management** — Test runs with execution snapshot creation
- **Execution Persistence** — Test execution records with step-by-step results
- **Immutable Attempts** — Execution retests stored as append-only history
- **Evidence Storage** — File uploads to Supabase Storage with signed URL access
- **Failures & Feedback** — Bug reports and general feedback linked to executions
- **QA Board Persistence** — Work items with live counters derived from executions
- **Live Board Counters** — Real-time statistics based on actual execution data
- **Reports** — Report generation with unique numbering per application/year
- **Immutable Snapshots** — Report state frozen at generation with SHA-256 checksum
- **Report Approvals** — Three-stage approval workflow (PREPARED_BY → REVIEWED_BY → APPROVED_BY)
- **Private PDF Artifacts** — PDF reports stored in private storage bucket
- **Overview Metrics** — Dashboard with 6 key metrics, application progress, trend chart
- **Overview Filters** — Filter by release, environment, and date range
- **Member Provisioning** — Invitation-based user onboarding with role assignment
- **Access Control Hardening** — Defense-in-depth with UI, server, and database RLS layers

#### Infrastructure

- **Demo Mode** — `NEXT_PUBLIC_QA_DEMO_MODE=true` for development without Supabase
- **TypeScript Strict Mode** — Full type safety across codebase
- **Zod Validation** — Runtime validation for all user inputs
- **Error Classification** — Typed mutation errors (FORBIDDEN, NOT_FOUND, VALIDATION, UNKNOWN)
- **Adapter Pattern** — Clean separation between raw DB rows and domain types
- **Vitest Test Suite** — 71 tests across 20 test files

#### Database

- **PostgreSQL Schema** — 28 tables with proper FK relationships
- **Row Level Security** — Comprehensive RLS policies on all tables
- **Security Definer Functions** — Role checks and access validation
- **Immutable Triggers** — Prevent updates/deletes on historical tables
- **Full-Text Search** — GIN index on scenario search vector
- **Atomic Report Numbering** — RPC function with upsert counter
- **Storage Buckets** — `qa-evidence` (50MB) and `qa-reports` (10MB) private buckets

### Changed

- Migrated from mock-driven frontend to full Supabase integration
- Replaced local state with server-component data fetching
- Updated all service functions to support demo mode gate
- Standardized error handling across all mutations
- Improved RLS policies for execution-scoped access

### Fixed

- Execution counters now derived from live data instead of stale plan state
- Report number allocation race condition eliminated with atomic RPC
- Attempt counter logic fixed for retest workflows
- Timestamp variable in execution mutation corrected
- Attachment delete policy implemented for cleanup
- Overview dashboard null-safety improved with `nullif()` guards

### Security

- **RLS Enforcement** — All tables protected by row-level security policies
- **Private Buckets** — Storage buckets not publicly readable
- **Signed URLs** — Time-limited access to sensitive files
- **Role Enforcement** — Three-layer authorization (UI, server, database)
- **Immutable Historical Records** — Attempts, snapshots, approvals cannot be modified
- **Server-Only Admin Operations** — Service role key never exposed to client
- **Password Security** — Supabase Auth handles bcrypt hashing

### Architecture

- Next.js App Router with server components
- Service layer abstraction over Supabase client
- Server actions for all mutations
- Client components receive data as props
- Demo mode via environment variable gate

---

## Version History

### 2026-08-24: Initial Supabase Integration

- `ea72bbe` — Test runs integration
- `3dbad16` — Test execution integration
- `45b319e` — Findings and feedback integration
- `4a01859` — QA board integration
- `a68d344` — Reports and snapshots integration
- `2d9d4ed` — Overview metrics integration
- `6a66147` — Management persistence integration

### 2026-08-25: Hardening & Polish

- `15e3bad` — Access control hardening
- `8a1d10d` — Private report PDF generation
- `40bda32` — Integration audit completion
- `5a6208b` — Report approvals and member invitations
- `91acba5` — Board counters from live executions
- `de23fe5` — Overview filters
- `3fd6430` — Auth infrastructure for invitations
- `2202aea` — Format and overview fixes

---

## Migration History

16 migration files applied to production:

| Date       | Migration                                                      | Description                           |
| ---------- | -------------------------------------------------------------- | ------------------------------------- |
| 2026-08-24 | `20260824170405_initial_qa_hub.sql`                            | Base schema with all tables and enums |
| 2026-08-25 | `20260825042957_align_qa_hub_contract_and_security.sql`        | RLS tightening, new indexes           |
| 2026-08-25 | `20260825103000_add_scenario_mutation_functions.sql`           | Scenario CRUD RPCs                    |
| 2026-08-25 | `20260825111500_grant_scenario_child_delete_for_updates.sql`   | Cascade delete grants                 |
| 2026-08-25 | `20260825133000_add_plan_mutation_functions.sql`               | Plan CRUD RPCs                        |
| 2026-08-25 | `20260825143000_grant_plan_child_delete_for_updates.sql`       | Cascade delete grants                 |
| 2026-08-25 | `20260825150000_add_run_mutation_functions.sql`                | Run creation RPC                      |
| 2026-08-25 | `20260825150005_grant_run_assignment_delete_for_updates.sql`   | Cascade delete grants                 |
| 2026-08-25 | `20260825150010_fix_run_execution_step_snapshot_insert.sql`    | Step snapshot fix                     |
| 2026-08-25 | `20260825160000_add_execution_mutation_function.sql`           | Execution recording RPC               |
| 2026-08-25 | `20260825160010_fix_execution_mutation_timestamp_variable.sql` | Timestamp fix                         |
| 2026-08-25 | `20260825160020_fix_execution_mutation_attempt_counter.sql`    | Attempt counter fix                   |
| 2026-08-25 | `20260825170000_add_attachment_delete_policy.sql`              | Attachment delete policy              |
| 2026-08-25 | `20260825190000_add_report_number_rpc.sql`                     | Report number allocation              |
| 2026-08-25 | `20260825200000_add_private_report_storage.sql`                | Reports bucket                        |
| 2026-08-25 | `20260825210000_add_overview_filters.sql`                      | Overview filters                      |
