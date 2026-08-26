# QA Catalog Import

This document describes the process and results of importing the reviewed QA scenario catalogs into the Supabase database.

## Import Summary

| Application     | Modules | Features | Scenarios |     Steps | Status      |
| --------------- | ------: | -------: | --------: | --------: | ----------- |
| Portal          |      10 |       13 |        60 |       214 | ✅ IMPORTED |
| CRM             |       9 |        9 |        57 |       181 | ✅ IMPORTED |
| Flowra          |      12 |       12 |        73 |       210 | ✅ IMPORTED |
| Daily Operation |       5 |        5 |        36 |       115 | ✅ IMPORTED |
| ITQM            |       8 |        8 |        54 |       186 | ✅ IMPORTED |
| Intranet        |       8 |        8 |        50 |       170 | ✅ IMPORTED |
| **Total**       |  **52** |   **55** |   **330** | **1,076** |             |

## Quality Checks

- ✅ Zero duplicate scenario codes
- ✅ Zero orphaned scenarios (all belong to correct application)
- ✅ Zero orphaned steps
- ✅ All scenario codes follow `QA-<APP>-<MODULE>-<NNN>` format
- ✅ All required fields populated (title, description, preconditions, steps, expected_result)
- ✅ All priorities valid (P0/P1/P2/P3)
- ✅ All test types valid (HAPPY_PATH/VALIDATION/NEGATIVE/PERMISSION/EDGE_CASE/INTEGRATION/REGRESSION/RESPONSIVE/ACCESSIBILITY/PERFORMANCE)
- ✅ Idempotent re-runs produce zero new records and zero errors

## Import Script

Location: `scripts/import-qa-catalog.ts`

### Usage

```bash
# Dry-run (default, no DB writes)
npx tsx scripts/import-qa-catalog.ts --dry-run --portal
npx tsx scripts/import-qa-catalog.ts --dry-run --all

# Apply (writes to DB)
npx tsx scripts/import-qa-catalog.ts --apply --portal
npx tsx scripts/import-qa-catalog.ts --apply --all

# Single app
npx tsx scripts/import-qa-catalog.ts --apply --crm
npx tsx scripts/import-qa-catalog.ts --apply --flowra
npx tsx scripts/import-qa-catalog.ts --apply --daily-operation
npx tsx scripts/import-qa-catalog.ts --apply --itqm
npx tsx scripts/import-qa-catalog.ts --apply --intranet
```

### Flags

| Flag                | Description                                     |
| ------------------- | ----------------------------------------------- |
| `--dry-run`         | Parse and validate only, no DB writes (default) |
| `--apply`           | Write to database                               |
| `--all`             | Import all 6 applications                       |
| `--portal`          | Import Portal only                              |
| `--crm`             | Import CRM only                                 |
| `--flowra`          | Import Flowra only                              |
| `--daily-operation` | Import Daily Operation only                     |
| `--itqm`            | Import ITQM only                                |
| `--intranet`        | Import Intranet only                            |

### Behavior

- **Idempotent**: Running `--apply` multiple times does not create duplicates
- **Upserts modules**: Creates new modules, skips existing (matched by `application_id + slug`)
- **Upserts features**: Creates new features, skips existing (matched by `module_id + slug`)
- **Upserts scenarios**: Creates new scenarios by `scenario_code`, updates if source data changed
- **Replaces steps**: Deletes and re-inserts steps on scenario update
- **Replaces tags**: Deletes and re-inserts tags on scenario update
- **Atomic per app**: If one app fails, previous apps are not rolled back
- **Validates first**: Checks all scenario codes, required fields, and enum values before any writes

### Source of Truth

Catalog markdown files in `docs/qa-scenarios/`:

- `portal.md` — Authentication, user management, role management, app switcher, notifications, account settings, admin panel, audit logs, announcements, SSO
- `crm.md` — Accounts, contacts, leads, prospects, stock, search/filters/pagination, permissions
- `flowra.md` — Opening Account workflow, draft/autosave, validation, submission, detail view, OFI tracking
- `daily-operation.md` — Today workspace, approvals, history, IT config management
- `itqm.md` — Development request lifecycle, issue tracker, kanban board, configuration
- `intranet.md` — Announcements, regulations, admin panel, notifications

**DO NOT MODIFY** the catalog markdown files directly — they are the reviewed source. Edit via the QA Hub UI or Supabase dashboard.

## Schema Changes

The import required one schema addition:

```sql
-- Added via migration 20260827060000_add_scenario_code.sql
ALTER TABLE test_scenarios ADD COLUMN scenario_code text NOT NULL UNIQUE;
```

This column provides stable, human-readable identifiers (e.g., `QA-PORTAL-AUTH-001`) that survive app-side changes and enable cross-system traceability.

## Re-import Workflow

If catalog files are updated after import:

1. Update the markdown file in `docs/qa-scenarios/`
2. Run dry-run: `npx tsx scripts/import-qa-catalog.ts --dry-run --<app>`
3. Verify the diff shows expected changes
4. Run apply: `npx tsx scripts/import-qa-catalog.ts --apply --<app>`
5. Verify: check DB counts and idempotency with a second apply run
