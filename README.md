# CSSI QA Hub

A production-ready QA management platform for manual test execution, findings tracking, and release readiness reporting. It solves the problem of coordinating QA workflows across testers, leads, and administrators in a single auditable system with immutable historical records.

## Overview

QA Hub provides end-to-end support for the QA lifecycle:

- **Scenario management** — reusable test definitions with steps, tags, and search
- **Test plans** — assemble scenarios into scoped plans for specific releases
- **Test runs** — execute plans against concrete builds with assigned testers
- **Execution workspace** — record PASS/FAIL/BLOCKED/SKIP with step-by-step results
- **Evidence & findings** — attach screenshots/logs, create failures and feedback
- **QA Board** — live progress view with counters derived from executions
- **Reports** — immutable snapshots with approval workflows and PDF generation
- **Overview** — dashboard metrics with filtering by release, environment, and date range

The platform enforces role-based access at every layer (UI, server, database RLS) and preserves historical integrity through append-only immutable tables.

## Core Workflow

### ADMIN

→ Provisions QA members via invitation
→ Manages reference data (applications, modules, features, environments, releases)

### QA_LEAD

→ Creates and edits test scenarios
→ Builds test plans (selects scenarios + assigns testers)
→ Creates test runs from plans
→ Reviews and approves reports

### QA_TESTER

→ Executes assigned scenarios in a run
→ Records step results (PASS/FAIL/SKIPPED)
→ Sets execution outcome (PASS/FAIL/BLOCKED/SKIPPED)
→ Uploads evidence attachments
→ Creates findings (failures) and feedback

### Retest

→ Immutable execution attempts preserve every retest
→ Boards update live counters from execution data

### Report → Approvals → PDF

→ Report created with immutable snapshot
→ PREPARED_BY → REVIEWED_BY → APPROVED_BY workflow
→ Private PDF stored in Supabase Storage with SHA-256 checksum

### Overview

→ Metrics, distribution charts, trend lines, recent runs, top failures
→ Filterable by release, environment, and date range

## Tech Stack

| Component      | Technology                                          |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16.2.6                                      |
| UI Library     | React 19.2.4                                        |
| Language       | TypeScript 5                                        |
| Database       | PostgreSQL (Supabase)                               |
| Auth           | Supabase Auth with SSR                              |
| Storage        | Supabase Storage                                    |
| Client Library | @supabase/ssr 0.12.5, @supabase/supabase-js 2.112.4 |
| Testing        | Vitest 4.1.11                                       |
| UI Components  | shadcn/ui (Tailwind CSS v4)                         |
| Charts         | Recharts 3.8.0                                      |
| Forms          | react-hook-form + zod 4.4.3                         |
| Data Table     | @tanstack/react-table 9.1.2                         |
| Formatting     | Prettier 3.8.3, ESLint 9                            |

## Architecture

```mermaid
graph TB
    Browser["Browser / Next.js App Router"]
    ServerActions["Server Actions app/actions/"]
    Services["Service Layer services/"]
    Adapters["Adapters lib/*-adapters.ts"]
    Supabase["Supabase PostgreSQL + RLS"]
    Storage["Supabase Storage"]
    Auth["Supabase Auth"]

    Browser --> ServerActions
    Browser --> Services
    ServerActions --> Services
    Services --> Adapters
    Services --> Supabase
    Services --> Storage
    Services --> Auth
    Services -.demo--> DemoData["lib/data/seed.ts"]
```

### Server / Client Boundaries

- **"server-only" imports** in all service files enforce server-side execution
- **Server actions** (`app/actions/`) handle mutations that require authentication context
- **Client components** receive data passed as props; they never call Supabase directly
- **Demo mode** is controlled by `NEXT_PUBLIC_QA_DEMO_MODE`; when enabled, services return mock data from `lib/data/seed.ts`

### Service Layer Pattern

Each domain has a service module (e.g., `services/reports.ts`) that:

1. Checks demo mode first
2. Validates input with Zod schemas
3. Calls the Supabase server client or admin client
4. Throws typed mutation errors with classification codes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `UNKNOWN`)

### Supabase Clients

- **Server client** (`lib/supabase/server.ts`) — uses `createServerClient` from `@supabase/ssr`, reads cookies from the request
- **Admin client** (`lib/supabase/admin.ts`) — uses the service role key, bypasses RLS, used only for member invitation flows
- **Browser client** (`lib/supabase/client.ts`) — `createBrowserClient`, used in client components

### Database Authorization

Row Level Security (RLS) is the primary authorization layer. All tables have RLS enabled. Read policies use `private.has_role()` to verify caller identity. Write policies enforce role checks and ownership constraints. Storage policies verify execution access before allowing uploads.

### Demo Mode

Set `NEXT_PUBLIC_QA_DEMO_MODE=true` in `.env.local`. This returns seed data from `lib/data/seed.ts` and `lib/data/product-seed.ts` instead of calling Supabase. Authentication is bypassed; a fixed demo profile is returned.

## Roles & Permissions

| Capability          | ADMIN | QA_LEAD |      QA_TESTER      |
| ------------------- | :---: | :-----: | :-----------------: |
| Member invitation   |  ✅   |   ❌    |         ❌          |
| Role/status changes |  ✅   |   ❌    |         ❌          |
| Reference data CRUD |  ✅   |   ❌    |         ❌          |
| Scenario CRUD       |  ✅   |   ✅    |         ❌          |
| Plan CRUD           |  ✅   |   ✅    |         ❌          |
| Run management      |  ✅   |   ✅    |         ❌          |
| Execution recording |  ✅   |   ✅    | ✅ (assigned runs)  |
| Evidence upload     |  ✅   |   ✅    | ✅ (assigned runs)  |
| Findings (failures) |  ✅   |   ✅    | ✅ (own executions) |
| Feedback creation   |  ✅   |   ✅    |         ✅          |
| Board move items    |  ✅   |   ✅    |         ❌          |
| Report generation   |  ✅   |   ✅    |         ❌          |
| Review reports      |  ✅   |   ✅    |         ❌          |
| Approve reports     |  ✅   |   ❌    |         ❌          |

### Defense in Depth

1. **UI authorization** — navigation items and action buttons are conditionally rendered based on role
2. **Server action/service validation** — `requireUser()` and role checks in each service function
3. **PostgreSQL RLS** — row-level policies enforced per-request; security definer functions used where needed
4. **Storage policies** — bucket access verified against execution run membership

## Domain Model

### Reference Data

- **profiles** — user identity linked to auth.users, holds role and status
- **applications** — top-level product containers with slugs
- **modules** — functional groupings within applications
- **features** — feature areas within modules
- **environments** — deployment targets (AVAILABLE/MAINTENANCE/RESTRICTED)
- **releases** — versioned builds tied to an application + environment

### Test Artifacts

- **test_scenarios** — reusable test definitions with full-text search
- **test_steps** — ordered steps within a scenario (cascade deleted with scenario)
- **scenario_tags** — lowercase tag multi-value on scenarios
- **test_plans** — scoped plan selecting scenarios + assigning testers
- **test_plan_items** — scenario-to-plan mapping with position
- **test_plan_assignments** — tester-to-plan mapping

### Execution

- **test_runs** — concrete execution instances against a release build
- **test_run_assignments** — tester-to-run mapping
- **test_executions** — one per scenario per run (snapshots scenario data at creation)
- **test_execution_steps** — step results per execution
- **test_execution_attempts** — immutable retest history (append-only, no updates/deletes)

### Findings & Feedback

- **qa_work_items** — board items tracked across releases
- **qa_work_item_assignments** — assignees per work item
- **qa_work_item_history** — immutable status change log
- **failures** — formal bug reports linked to executions/attempts
- **feedback** — general feedback on executions (BUG/UX/COPY/IMPROVEMENT/QUESTION)
- **attachments** — evidence files linked to executions
- **comments** — threaded comments on any subject

### Reporting

- **reports** — one per test_run with report number, result, conclusion
- **report_number_counters** — per-application per-year incrementing counter
- **report_snapshots** — immutable JSON snapshot of report state at generation
- **report_approvals** — approval history (PREPARED_BY → REVIEWED_BY → APPROVED_BY)
- **audit_events** — append-only activity log

## Test Lifecycle

### Plan Status Flow

```
DRAFT → READY → ACTIVE → COMPLETED
                     ↘ ARCHIVED
```

### Run Status Flow

```
NOT_STARTED → IN_PROGRESS → COMPLETED
              ↗ BLOCKED ↗ CANCELLED
```

### Execution Status Flow

```
NOT_TESTED → PASS / FAIL / BLOCKED / SKIPPED
              ↖ RETRY (creates new immutable attempt)
```

### Finding Status Flow

```
OPEN → IN_PROGRESS → RESOLVED → CLOSE
         ↘ WONT_FIX
```

### Report Approval Flow

```
FINALIZED
  → PREPARED_BY (auto-created on report generation)
  → REVIEWED_BY (QA_LEAD or ADMIN)
  → APPROVED_BY (ADMIN only)
```

## Historical Integrity

The following tables are **immutable** (no updates or deletes permitted):

- **test_execution_attempts** — preserves every retest iteration
- **qa_work_item_history** — complete audit trail of board status changes
- **report_snapshots** — frozen report state at generation time
- **report_approvals** — permanent approval record
- **audit_events** — permanent activity log

When a scenario is edited, **existing executions are not rewritten**. Executions snapshot scenario data at creation time (`scenario_title`, `scenario_description`, `scenario_steps`, etc.), so historical execution records remain accurate to the scenario state at the time of testing.

Report numbers are allocated atomically via `next_report_number()` RPC — a PostgreSQL upsert on `report_number_counters` guarantees no duplicates per application per year.

PDF artifacts are stored with their SHA-256 hash in `report_snapshots.pdf_sha256`, enabling tamper verification.

## Storage

Two private buckets are used:

| Bucket        | Purpose                 | Max Size | Allowed Types                                                                                         | Access                                                             |
| ------------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `qa-evidence` | Test execution evidence | 50 MB    | image/png, image/jpeg, image/webp, application/pdf, text/plain, text/csv, application/json, video/mp4 | Based on execution run membership                                  |
| `qa-reports`  | Generated PDF reports   | 10 MB    | application/pdf                                                                                       | Readable by any authenticated user; writable by ADMIN/QA_LEAD only |

All storage access is through signed URLs (1-hour expiry for preview, 1-hour for PDF retrieval). Objects are path-scoped under `executionId/filename.pdf`.

## Authentication

### Login Flow

1. User enters email + password on `/login`
2. Server action calls `signInWithPassword` via Supabase Auth
3. SSR cookie is set; profile is fetched from `public.profiles`
4. Based on profile status:
   - `ACTIVE` → redirect to `/overview`
   - `UNPROVISIONED` → redirect to `/access?reason=unprovisioned`
   - `INACTIVE` → redirect to `/access?reason=inactive`

### Invitation / Provisioning

1. ADMIN invites a member via Supabase Admin Auth API (`inviteUserByEmail`)
2. A `profiles` row is upserted with the invited user's auth ID, email, name, and role
3. The invitation email contains a redirect to `/auth/set-password`
4. Upon first sign-in, the user's profile is active and they can access QA Hub

### Logout

1. `signOut({ scope: "global" })` clears all auth cookies
2. User is redirected to `/login`

## Supabase

### Architecture

- **Development**: local PostgreSQL instance (or Docker-based Supabase)
- **Production**: hosted Supabase project (`cyswyclazdhsznwocvdr.supabase.co`)
- **Migrations**: SQL files in `supabase/migrations/`, applied manually via Supabase Dashboard SQL Editor or `supabase db push`

### Migration Workflow

1. Create a new SQL file in `supabase/migrations/` with a timestamp prefix (e.g., `20260825120000_add_feature.sql`)
2. Review the migration for idempotency (`IF NOT EXISTS`, `ALTER TYPE ... ADD VALUE IF NOT EXISTS`)
3. Apply to the target environment
4. Verify with `bun run check`

**Never run destructive linked resets against the production database.** Migrations are designed to be additive; down-migrations are not supported.

### Key RPCs

- `get_overview_dashboard(filter_release_id, filter_environment_id, filter_start_date, filter_end_date)` — returns all overview metrics
- `create_test_scenario(...)` — creates a scenario with steps and tags
- `update_test_scenario(...)` — updates a scenario while preserving step history
- `create_test_plan(...)` / `update_test_plan(...)` — plan CRUD with scenario/assignment validation
- `record_test_run(...)` — creates a run with execution snapshots
- `record_test_execution(...)` — records execution status and step results
- `next_report_number(application_id, year)` — atomically allocates a unique report number

## Demo Mode

Enable with `NEXT_PUBLIC_QA_DEMO_MODE=true`.

**What changes:**

- All service functions return static seed data from `lib/data/seed.ts` and `lib/data/product-seed.ts`
- Authentication is bypassed; a fixed demo profile is returned
- Supabase calls are skipped entirely

**What remains the same:**

- UI component behavior and layout
- Form validation schemas
- Type definitions
- Build output structure

Use demo mode for frontend-only development without requiring a Supabase connection.

## Local Development

### Installation

```bash
bun install
```

### Environment Setup

```bash
cp .env.example .env.local
# Add Supabase credentials for full integration:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# SUPABASE_SECRET_KEY=your-service-role-key
```

### Commands

```bash
bun run dev          # Start dev server
bun run dev:demo     # Start with demo mode enabled
bun run build        # Production build
bun run build:demo   # Demo production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run format       # Format with Prettier
bun run format:check # Check formatting
bun run typecheck    # TypeScript type checking
bun run test         # Run Vitest test suite
bun run check        # Run format:check + lint + typecheck + test
```

## Verification

Verification scripts in `scripts/` test the hosted Supabase instance against real RLS policies and workflow invariants. They are grouped by phase:

| Group        | Scripts                                                                  | What They Verify                                  |
| ------------ | ------------------------------------------------------------------------ | ------------------------------------------------- |
| **Phase 1**  | `verify-phase1-rls.ts`                                                   | Profile read/write access by role                 |
| **Phase 2**  | `verify-phase2-scenario-reads.ts`, `verify-phase2-scenarios-rls.ts`      | Scenario read permissions and RLS boundaries      |
| **Phase 3**  | `verify-phase3-plan-workflow.ts`, `verify-phase3-plans-rls.ts`           | Plan CRUD workflow and role-gated writes          |
| **Phase 4**  | `verify-phase4-run-workflow.ts`, `verify-phase4-runs-rls.ts`             | Run creation and assignment RLS                   |
| **Phase 5**  | `verify-phase5-execution-workflow.ts`, `verify-phase5-executions-rls.ts` | Execution recording and access control            |
| **Phase 6**  | `verify-phase6-evidence-rls.ts`, `verify-phase6-evidence-workflow.ts`    | Evidence upload/download with run-scoped access   |
| **Phase 7**  | `verify-phase7-findings.ts`                                              | Failure creation and feedback restrictions        |
| **Phase 8**  | `verify-phase8-board.ts`                                                 | Board item movement and counter accuracy          |
| **Phase 9**  | `verify-phase9-reports.ts`                                               | Report number allocation, snapshot immutability   |
| **Phase 10** | `verify-phase10-overview.ts`                                             | Dashboard RPC output structure and filter support |
| **Phase 11** | `verify-phase11-management.ts`                                           | Admin reference data operations                   |
| **Phase 13** | `verify-phase13-pdf.ts`                                                  | PDF upload, signed URL access, storage RLS        |

All scripts use the same credentials as the application (read from `.env.local`). Run individually:

```bash
npx tsx scripts/verify-phase7-findings.ts
```

## Production Readiness

**Operational Status: READY**

Verified domains:

- Auth and member provisioning
- Role-based access control (RLS)
- Scenario management with full-text search
- Plan and run workflows
- Execution with immutable attempts
- Evidence storage with signed URLs
- Failures and feedback with execution-scoped access
- Board with live execution-derived counters
- Report generation with immutable snapshots
- Approval workflow (PREPARED_BY → REVIEWED_BY → APPROVED_BY)
- Private PDF storage with SHA-256 integrity
- Overview metrics with filtering
- Demo mode

## Scenario Catalog (Manual QA)

The `docs/qa-scenarios/` directory contains the source-of-truth manual test scenario catalogs for all six CSSI applications. These are **not yet imported** into the database — they are reviewed Markdown files that QA Leads use as the reference before importing scenarios via the QA Hub UI.

### Coverage Summary

| Application | Scenarios | Status | READY | LIMITED | MOCK | STUB |
| ----------- | --------: | :----: | ----: | -----: | ---: | ---: |
| Portal | 60 | DRAFT | ✅ All | Username/avatar upload disabled | — | — |
| CRM | 57 | DRAFT | ✅ Core | Trading modules (mock data) | — | Lead duplicate detection, subscriptions |
| Flowra | 73 | DRAFT | ✅ OA workflow | Spouse hydration limitation | — | Compliance, CSO, Purchase, Risk, Settlement |
| Daily Operation | 36 | DRAFT | ✅ Today/Approvals/History/Config | Draft persistence local-only | — | Settlement/Risk divisions (unconfigured) |
| ITQM | 54 | DRAFT | ✅ Dev Request/Done Report/Config | Attachment upload (console only) | Issue Phase 1 | — |
| Intranet | 50 | DRAFT | ✅ Full | Attachment upload needs verification | — | — |
| **Total** | **330** | | | | | |

### How to Use

1. **Read the catalog** in `docs/qa-scenarios/<app>.md` for the application you're testing.
2. **Check Implementation Status** — notes on READY / LIMITED / MOCK / STUB features.
3. **Execute scenarios in priority order** — Critical → High → Medium → Low.
4. **Record Pass/Fail/Blocked** results and reference scenario IDs in bug reports.
5. **Update status** from DRAFT to REVIEWED once validated against the live system.
6. **Import into QA Hub** via the UI when ready (Admin → Scenarios → Import from catalog).

See [`docs/qa-scenarios/README.md`](./docs/qa-scenarios/README.md) for detailed usage guidance.

## Known Limitations

- **Sidebar visual polish** — deferred; functional layout is complete
- **Verification script env loading** — some scripts require manual `.env.local` injection via `dotenv` when run with Node.js; Bun handles this automatically
- **Phase 13 hosted verification** — can fail with duplicate report numbers when test fixtures already exist; the code correctly handles this case
- **No signup endpoint** — the frontend does not expose a registration page; all users must be invited by an administrator. Open email signup should be disabled in the Supabase Dashboard for production.
- **Next.js workspace-root warning** — a non-blocking warning about `pnpm-lock.yaml` at the workspace root; safe to ignore
