# Operations Guide

Operational procedures for administering CSSI QA Hub.

## Table of Contents

1. [User Management](#user-management)
2. [Reference Data Management](#reference-data-management)
3. [Deploying Migrations](#deploying-migrations)
4. [Storage Behavior](#storage-behavior)
5. [Verification Scripts](#verification-scripts)
6. [Troubleshooting](#troubleshooting)

---

## User Management

### Provisioning a New Member

1. Navigate to **Management** → **Members**
2. Click **Invite Member**
3. Enter:
   - **Email** — Must be unique
   - **Full Name** — Display name
   - **Role** — ADMIN, QA_LEAD, or QA_TESTER
4. Click **Send Invitation**

The system:

- Sends an invitation email via Supabase Auth
- Creates a pending profile record
- User clicks the link to set their password

### Resending an Invitation

1. Go to **Management** → **Members**
2. Find the member with pending invitation
3. Click **Resend Invite**

### Changing a Member's Role

1. Navigate to **Management** → **Members**
2. Click **Edit** on the member
3. Select new role
4. Click **Save**

**Note**: Only administrators can change roles. The database has a trigger that prevents non-admins from modifying the `role` column.

### Deactivating a Member

1. Go to **Management** → **Members**
2. Click **Edit**
3. Change status to **INACTIVE**
4. Click **Save**

Deactivated users can still authenticate but are redirected to `/access?reason=inactive`.

### Viewing Member Status

The members list shows:

- **Invitation Pending** — Email sent but not accepted
- **Last Sign In** — Timestamp of last login
- **Email Confirmed** — Whether email is verified
- **Status** — ACTIVE or INACTIVE

---

## Reference Data Management

### Applications

1. Navigate to **Management** → **Applications**
2. Click **Add Application**
3. Enter name (slug is auto-generated from name)
4. Enter owner name
5. Click **Save**

To deactivate: toggle the active switch.

### Modules

Modules are created within the scenario form when creating/editing a scenario. They appear automatically based on existing applications.

### Features

Features are created within the scenario form when creating/editing a scenario. They appear automatically based on existing modules.

### Environments

1. Navigate to **Management** → **Environments**
2. Click **Add Environment**
3. Enter name (slug auto-generated)
4. Enter base URL (optional)
5. Click **Save**

To update availability:

1. Click **Edit** on the environment
2. Change status: AVAILABLE, MAINTENANCE, or RESTRICTED
3. Click **Save**

### Releases

1. Navigate to **Management** → **Releases**
2. Click **Add Release**
3. Enter version (e.g., `v1.2.0`)
4. Select application
5. Click **Save**

The system auto-selects the UAT environment.

To advance release status:

1. Click **Edit** on the release
2. Select next status
3. Click **Save**

**Release Status Flow**:

```
PLANNED → TESTING → QA_APPROVED → RELEASED
                ↘ REJECTED → ARCHIVED
```

---

## Deploying Migrations

### Prerequisites

- Access to Supabase Dashboard
- Understanding of migration idempotency

### Deployment Steps

1. **Review the Migration**

   ```bash
   cat supabase/migrations/<filename>.sql
   ```

2. **Test Locally** (if using local Supabase)

   ```bash
   supabase db push
   ```

3. **Apply to Production**
   - Open Supabase Dashboard
   - Navigate to **SQL Editor**
   - Copy and paste the migration SQL
   - Execute

4. **Verify**
   ```bash
   bun run check
   npx tsx scripts/verify-final-audit.ts
   ```

### Migration Best Practices

- All migrations use `IF NOT EXISTS` where appropriate
- Type alterations use `ADD VALUE IF NOT EXISTS`
- Functions use `CREATE OR REPLACE`
- Policies use `DROP POLICY IF EXISTS` before recreation
- Storage buckets use `ON CONFLICT DO UPDATE`

### Migration Files

All migrations are in `supabase/migrations/` with timestamp prefixes:

```
20260824170405_initial_qa_hub.sql
20260825042957_align_qa_hub_contract_and_security.sql
...
```

The timestamp format is `YYYYMMDDHHMMSS`.

---

## Storage Behavior

### Buckets

| Bucket        | Purpose       | Max Size | MIME Types                                         |
| ------------- | ------------- | -------- | -------------------------------------------------- |
| `qa-evidence` | Test evidence | 50 MB    | image/png, jpeg, webp, pdf, text/*, csv, json, mp4 |
| `qa-reports`  | PDF reports   | 10 MB    | application/pdf only                               |

Both buckets are **private** (not publicly accessible).

### Upload Path Structure

Evidence files use this pattern:

```
{execution_id}/{attachment_id}-{timestamp}-{filename}
```

Example:

```
077281b7-a56a-48c1-bd1f-4fde230aec1a/e425e01e-3598-4366-b1ce-1ac209f1ecb6-phase6-workflow-proof.png
```

Report PDFs use:

```
reports/{report_id}/{report_number}.pdf
```

### Signed URLs

All storage access uses signed URLs with 1-hour expiry:

```typescript
const { data } = await supabase.storage
  .from("qa-evidence")
  .createSignedUrl(path, 3600)
```

### Cleanup

When deleting an attachment:

1. Database row is deleted first
2. Storage object is deleted second
3. If storage deletion fails, a warning is returned but the metadata is cleaned up

---

## Verification Scripts

Verification scripts test the hosted Supabase instance against real RLS policies.

### Running Verification

```bash
# Single script
npx tsx scripts/verify-phase7-findings.ts

# All scripts
for script in scripts/verify-phase*.ts; do
  npx tsx "$script"
done
```

### Script Groups

| Group           | Scripts                                                                  | Purpose                                         |
| --------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Auth & Profiles | `verify-phase1-rls.ts`                                                   | Profile read/write by role                      |
| Scenarios       | `verify-phase2-scenario-reads.ts`, `verify-phase2-scenarios-rls.ts`      | Scenario permissions                            |
| Plans           | `verify-phase3-plan-workflow.ts`, `verify-phase3-plans-rls.ts`           | Plan CRUD and assignments                       |
| Runs            | `verify-phase4-run-workflow.ts`, `verify-phase4-runs-rls.ts`             | Run creation and assignments                    |
| Executions      | `verify-phase5-execution-workflow.ts`, `verify-phase5-executions-rls.ts` | Execution recording                             |
| Evidence        | `verify-phase6-evidence-rls.ts`, `verify-phase6-evidence-workflow.ts`    | Upload/download access                          |
| Findings        | `verify-phase7-findings.ts`                                              | Failure/feedback restrictions                   |
| Board           | `verify-phase8-board.ts`                                                 | Item movement and counters                      |
| Reports         | `verify-phase9-reports.ts`                                               | Report number allocation, snapshot immutability |
| Overview        | `verify-phase10-overview.ts`                                             | Dashboard RPC output                            |
| Management      | `verify-phase11-management.ts`                                           | Admin reference data ops                        |
| PDF             | `verify-phase13-pdf.ts`                                                  | PDF upload, signed URLs                         |

### Final Audit

```bash
npx tsx scripts/verify-final-audit.ts
```

Checks data integrity:

- Orphan references
- Duplicate report numbers
- Snapshot consistency

### Credentials

Verification scripts use the same credentials as the application:

- Lead: `phase2.lead@localhost.com`
- Tester: `phase2.tester@localhost.com`

These are hardcoded in the scripts for consistent testing.

---

## Troubleshooting

### RLS Permission Denied (42501)

**Symptom**: "You do not have permission to..." errors

**Causes**:

1. User is not authenticated
2. User's profile role doesn't match required role
3. User is not assigned to the run

**Resolution**:

```sql
-- Check user's role
SELECT id, email, role, status FROM public.profiles WHERE id = 'user-uuid';

-- Check run assignments
SELECT * FROM public.test_run_assignments WHERE test_run_id = 'run-uuid';
```

### Unprovisioned Account

**Symptom**: Redirected to `/access?reason=unprovisioned`

**Cause**: Auth user exists but no `profiles` row

**Resolution**:

```sql
-- Bootstrap first admin (see docs/supabase-phase1-bootstrap.md)
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES ('user-uuid', 'email@example.com', 'Name', 'ADMIN', 'ACTIVE');
```

### Inactive Account

**Symptom**: Redirected to `/access?reason=inactive`

**Cause**: Profile exists but status is INACTIVE

**Resolution**:

```sql
UPDATE public.profiles SET status = 'ACTIVE' WHERE id = 'user-uuid';
```

### Evidence Upload Failure

**Symptom**: "Unable to register this attachment"

**Causes**:

1. File exceeds 50MB limit
2. MIME type not allowed
3. Path doesn't match execution ID

**Resolution**:

- Check file size: `ls -lh attachment.pdf`
- Verify MIME type in upload metadata
- Ensure path starts with `{execution_id}/`

### Duplicate Report Number

**Symptom**: "duplicate key value violates unique constraint"

**Cause**: Report number already exists (should not happen with atomic RPC)

**Resolution**:

```sql
-- Check existing numbers
SELECT report_number FROM public.reports WHERE report_number LIKE 'QA-PORTAL-2026-%';

-- Reset counter if needed
UPDATE public.report_number_counters SET last_number = 0 WHERE application_id = 'app-uuid';
```

### Signed PDF Access Expired

**Symptom**: 403 error when accessing PDF

**Cause**: Signed URL expired (1-hour lifetime)

**Resolution**: Request a new signed URL:

```typescript
const { data } = await supabase.storage
  .from("qa-reports")
  .createSignedUrl(path, 3600)
```

### Next.js Workspace Warning

**Symptom**: "Turbopack needs to create the dis... workspace-root"

**Cause**: Mix of package managers (pnpm at root, bun in project)

**Resolution**: Safe to ignore. Does not affect functionality. To suppress:

```bash
# Add to .npmrc or remove root lockfile
rm /home/kiyaya/pnpm-lock.yaml  # Only if you don't need it
```

**Do not delete** if other projects depend on it.

### Migration Already Applied

**Symptom**: "relation already exists" or similar

**Resolution**: All migrations use idempotent operations (`IF NOT EXISTS`, `CREATE OR REPLACE`). Safe to re-run.

---

## Emergency Procedures

### Database Reset (NOT RECOMMENDED)

Due to immutable tables and foreign key constraints, a full reset requires:

1. Disable RLS temporarily
2. Truncate all tables in reverse dependency order
3. Re-enable RLS

**Warning**: This destroys all historical data including audit logs and immutable attempts.

### User Lockout Recovery

If a user cannot access the system:

1. Verify Auth user exists in Supabase Dashboard
2. Check profile row exists
3. Confirm status is ACTIVE
4. Reset password via Auth UI if needed
