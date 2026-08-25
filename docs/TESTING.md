# Testing Strategy

This document describes the testing approach for CSSI QA Hub.

## Test Types

### Unit Tests (Vitest)

Located in `lib/*.test.ts` files, these test pure logic without external dependencies.

| Test File                                      | Coverage                   |
| ---------------------------------------------- | -------------------------- |
| `lib/attachment-path.test.ts`                  | Attachment path validation |
| `lib/auth-access.test.ts`                      | Route redirect logic       |
| `lib/execution-adapters.test.ts`               | Data mapping from raw rows |
| `lib/execution-form-schema.test.ts`            | Form validation schemas    |
| `lib/execution-metrics.test.ts`                | Metrics calculation        |
| `lib/plan-adapters.test.ts`                    | Plan data mapping          |
| `lib/plan-form-schema.test.ts`                 | Plan form validation       |
| `lib/reference-data-adapters.test.ts`          | Reference data mapping     |
| `lib/report-approvals.test.ts`                 | Approval sequence logic    |
| `lib/run-adapters.test.ts`                     | Run data mapping           |
| `lib/run-form-schema.test.ts`                  | Run form validation        |
| `lib/scenario-adapters.test.ts`                | Scenario data mapping      |
| `lib/scenario-filters.test.ts`                 | Search/filter logic        |
| `lib/scenario-form-schema.test.ts`             | Scenario form validation   |
| `components/domain/test-status-badge.test.tsx` | UI component               |

**Running unit tests**:

```bash
bun run test
```

### Integration Tests (Hosted Verification)

Located in `scripts/verify-phase*.ts`, these test against the real hosted Supabase instance.

**Purpose**: Verify RLS policies, storage access, and workflow correctness.

**Running**:

```bash
npx tsx scripts/verify-phase7-findings.ts
```

**Credentials**: Hardcoded test accounts in each script.

#### Verification Groups

| Phase | Focus                 | Mutates Data?                |
| ----- | --------------------- | ---------------------------- |
| 1     | Profile RLS           | No                           |
| 2     | Scenario reads/writes | No (read-only checks)        |
| 3     | Plan workflow         | Yes (creates test plans)     |
| 4     | Run workflow          | Yes (creates test runs)      |
| 5     | Execution recording   | Yes (records executions)     |
| 6     | Evidence upload       | Yes (uploads test evidence)  |
| 7     | Findings/feedback     | Yes (creates failures)       |
| 8     | Board operations      | Yes (moves items)            |
| 9     | Reports               | Yes (creates test reports)   |
| 10    | Overview              | No (read-only)               |
| 11    | Management            | Yes (creates reference data) |
| 13    | PDF/Storage           | Yes (uploads test PDF)       |

**Note**: Phases 3-11 and 13 create test data in the hosted database. This data should be cleaned up periodically.

### Build Validation

**Production build**:

```bash
bun run build
```

**Demo build**:

```bash
bun run build:demo
```

Both builds must complete successfully for deployment.

## Test Coverage Areas

### Authentication

- Login flow
- Session persistence
- Profile lookup
- Access decisions (active/unprovisioned/inactive)

### Authorization

- Role-based navigation
- Server action permissions
- RLS policy enforcement
- Storage bucket access

### Data Integrity

- Foreign key relationships
- Unique constraints
- Enum values
- Immutable table constraints

### Workflow

- Scenario CRUD
- Plan creation and assignment
- Run execution
- Evidence upload
- Report generation and approval

### Edge Cases

- Duplicate report numbers
- Expired signed URLs
- Missing reference data
- Empty states

## Demo Mode Testing

Demo mode bypasses Supabase entirely:

```bash
bun run dev:demo
```

Verifies:

- All UI components render
- Forms validate correctly
- Navigation works
- Charts display data

## Manual QA Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] Production build succeeds
- [ ] Demo build succeeds
- [ ] Key verification scripts pass (phases 1, 2, 7, 10)

### Post-Deployment

- [ ] Login flow works
- [ ] Role restrictions enforced
- [ ] Evidence upload works
- [ ] Report generation works
- [ ] Overview metrics accurate

## Manual QA Scenario Catalog

The `docs/qa-scenarios/` directory contains the source-of-truth manual test scenario catalogs for all six CSSI applications. These Markdown files are the **input** for scenario import into QA Hub — they are not executed directly from disk.

### Scenarios by Application

| Application | Scenarios | Status | READY | LIMITED | MOCK | STUB |
| ----------- | --------: | :----: | ----: | -----: | ---: | ---: |
| Portal | 60 | DRAFT | ✅ All | Username/avatar upload disabled | — | — |
| CRM | 57 | DRAFT | ✅ Core | Trading modules (mock data) | — | Lead duplicate detection, subscriptions |
| Flowra | 73 | DRAFT | ✅ OA workflow | Spouse hydration limitation | — | Compliance, CSO, Purchase, Risk, Settlement |
| Daily Operation | 36 | DRAFT | ✅ Today/Approvals/History/Config | Draft persistence local-only | — | Settlement/Risk divisions (unconfigured) |
| ITQM | 54 | DRAFT | ✅ Dev Request/Done Report/Config | Attachment upload (console only) | Issue Phase 1 | — |
| Intranet | 50 | DRAFT | ✅ Full | Attachment upload needs verification | — | — |
| **Total** | **330** | | | | | |

### Catalog Structure

Each scenario follows this format:
- **ID** — Stable identifier (`QA-<APP>-<MODULE>-<NNN>`)
- **Purpose** — Why the test matters
- **Preconditions** — What must be true before testing
- **Steps** — Numbered actions the tester performs
- **Expected Result** — Observable outcomes
- **Priority** — Critical / High / Medium / Low
- **Category** — Happy Path / Validation / Permission / Negative / Edge Case / Integration
- **Implementation Status** — READY / LIMITED / MOCK / STUB per module

### Usage Workflow

1. **Read** the catalog in `docs/qa-scenarios/<app>.md`
2. **Execute** scenarios against the live system (Critical → High → Medium → Low)
3. **Record** results in QA Hub by importing scenarios via Admin → Scenarios → Import
4. **Update** catalog status from DRAFT → REVIEWED once validated

See [`docs/qa-scenarios/README.md`](./qa-scenarios/README.md) and [`docs/qa-scenarios/REVIEW.md`](./qa-scenarios/REVIEW.md) for full details.

### Database Queries

Monitor query performance for:

- Overview dashboard RPC
- Scenario search
- Board item loading

### Storage

- Upload speed for large evidence files
- Signed URL generation latency

## Known Limitations

### Verification Scripts

- Some scripts require manual `.env.local` injection when run with Node.js
- Phase 9/13 can fail with duplicate key errors if test fixtures exist
- Scripts create real data that accumulates over time

### Test Data Cleanup

No automated cleanup exists for verification test data. Manual cleanup may be needed periodically:

```sql
-- Clean test data (use with caution)
DELETE FROM public.report_snapshots WHERE report_number LIKE 'QA-PORTAL-2026-000%';
DELETE FROM public.reports WHERE report_number LIKE 'QA-PORTAL-2026-000%';
-- ... additional cleanup as needed
```
