# Implementation Status

Source of truth for CSSI QA Hub feature completeness.

## Legend

- **REAL** — Fully implemented and verified
- **PARTIAL** — Implemented with known limitations
- **INTENTIONAL LIMITATION** — Working as designed, limitation is by choice
- **DEFERRED** — Planned but not yet implemented

## Status Overview

| Domain                  | Status | Notes                                                   |
| ----------------------- | ------ | ------------------------------------------------------- |
| Auth / Profiles / Roles | REAL   | Full SSR auth, profile lookup, invitation flow          |
| Reference Data          | REAL   | Applications, modules, features, environments, releases |
| Scenarios               | REAL   | CRUD, steps, tags, search, hierarchy                    |
| Plans                   | REAL   | CRUD, scenario selection, tester assignments            |
| Runs                    | REAL   | Creation, assignment, execution snapshot                |
| Executions              | REAL   | Step results, status updates, attempt history           |
| Evidence                | REAL   | Upload, download, signed URLs, RLS                      |
| Findings                | REAL   | Failures, feedback, RLS by execution access             |
| Board                   | REAL   | Work items, live counters from executions               |
| Reports                 | REAL   | Numbering, generation, immutable snapshots              |
| Approvals               | REAL   | PREPARED_BY → REVIEWED_BY → APPROVED_BY                 |
| PDF                     | REAL   | Generation, storage, SHA-256 integrity                  |
| Overview                | REAL   | Metrics, charts, filtering by release/env/date          |
| Demo Mode               | REAL   | Full mock data, bypasses Supabase                       |

## Detailed Status

### Authentication

- [x] Email/password login via Supabase Auth
- [x] SSR session management with cookies
- [x] Profile verification on each request
- [x] Invitation-based onboarding
- [x] Set-password flow via email link
- [x] Global sign-out
- [x] Active/inactive/unprovisioned state handling

### Role-Based Access Control

- [x] Three roles: ADMIN, QA_LEAD, QA_TESTER
- [x] UI-level role checks (navigation, buttons)
- [x] Server-level role checks (service functions)
- [x] Database RLS policies on all tables
- [x] Storage bucket policies
- [x] Immutable role change guard (trigger)

### Reference Data

- [x] Applications (CRUD, slug generation)
- [x] Modules (auto-created with scenarios)
- [x] Features (auto-created with scenarios)
- [x] Environments (CRUD, availability status)
- [x] Releases (CRUD, status workflow)

### Scenarios

- [x] Create with steps and tags
- [x] Update (preserves step history)
- [x] Delete (cascade to steps, tags)
- [x] Full-text search (tsvector + GIN index)
- [x] Filter by application/module/feature/type/priority/date
- [x] Hierarchy loading (applications → modules → features)

### Plans

- [x] Create with scenarios and assignments
- [x] Update with full replacement
- [x] Status workflow (DRAFT → READY → ACTIVE → COMPLETED/ARCHIVED)
- [x] Owner validation (must be ADMIN/QA_LEAD)
- [x] Assignment validation (must be QA_LEAD/QA_TESTER)

### Runs

- [x] Create from plan or manually
- [x] Execution snapshot on creation
- [x] Status workflow
- [x] Tester assignment
- [x] Build tracking

### Executions

- [x] Record status (PASS/FAIL/BLOCKED/SKIPPED)
- [x] Record step results
- [x] Immutable attempt history
- [x] Severity and bug reference tracking
- [x] Tested-by and tested-at timestamps
- [x] Constraint: failed executions require detail

### Evidence

- [x] Upload to qa-evidence bucket
- [x] Path validation (execution-scoped)
- [x] MIME type restriction
- [x] Size limit (50MB)
- [x] Signed URL retrieval
- [x] Delete with cleanup

### Findings

- [x] Create failures (linked to execution/attempt)
- [x] Create feedback (general notes)
- [x] Read all findings
- [x] Update own findings
- [x] Update by role (ADMIN/QA_LEAD)
- [x] Finding status workflow
- [x] Retest status tracking

### Board

- [x] List work items with filters
- [x] Create work items
- [x] Move items between statuses
- [x] Immutable history logging
- [x] Live counters from executions
- [x] Assignment tracking

### Reports

- [x] Generate from test run
- [x] Atomic report number allocation
- [x] Immutable JSON snapshot
- [x] PDF generation
- [x] PDF storage in private bucket
- [x] SHA-256 checksum verification

### Approvals

- [x] PREPARED_BY auto-recorded on creation
- [x] REVIEWED_BY by ADMIN or QA_LEAD
- [x] APPROVED_BY by ADMIN only
- [x] Sequential enforcement (prepared → reviewed → approved)
- [x] Immutable approval history
- [x] Remarks support

### Overview

- [x] 6 key metrics
- [x] Application progress cards
- [x] Status distribution chart
- [x] 7-day trend line
- [x] Recent runs list
- [x] Top failures list
- [x] Filter by release
- [x] Filter by environment
- [x] Filter by date range

### Demo Mode

- [x] Environment variable toggle
- [x] Full mock data for all domains
- [x] Bypass authentication
- [x] Separate build command (`build:demo`)

## Verification Status

| Check            | Status                 | Evidence                               |
| ---------------- | ---------------------- | -------------------------------------- |
| Format           | PASS                   | `bun run format:check`                 |
| Lint             | PASS                   | `bun run lint` (1 warning: unused var) |
| Typecheck        | PASS                   | `bun run typecheck`                    |
| Tests            | PASS                   | 71 tests, 20 files                     |
| Production build | PASS                   | `bun run build`                        |
| Demo build       | PASS                   | `bun run build:demo`                   |
| RLS policies     | PASS                   | Phase 1-7 verification scripts         |
| Storage access   | PASS                   | Phase 6 evidence workflow              |
| PDF generation   | INTENTIONAL LIMITATION | Phase 13 fails on duplicate fixtures   |
| Report approvals | PASS                   | Phase 9 verification                   |
| Overview metrics | PASS                   | Phase 10 verification                  |

## Known Limitations

### Intentional

- No signup endpoint (invite-only onboarding)
- Sidebar visual polish deferred
- Verification scripts accumulate test data
- Next.js workspace-root warning (non-blocking)

### Technical

- Report number allocation can conflict if fixtures already exist
- Storage cleanup on failure is best-effort
- Demo mode returns static data (no true offline capability)
