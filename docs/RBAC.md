# Role-Based Access Control (RBAC)

Authoritative permission document for CSSI QA Hub.

## Role Definitions

| Role          | Description                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| **ADMIN**     | Full system access: member management, reference data, all QA operations, report approval |
| **QA_LEAD**   | QA operations: scenario/plan/run management, execution oversight, report review/approval  |
| **QA_TESTER** | Execution only: run participation, evidence, findings, feedback                           |

## Capability Matrix

### Member Management

| Action          | ADMIN | QA_LEAD | QA_TESTER |
| --------------- | :---: | :-----: | :-------: |
| List members    |  ✅   |   ❌    |    ❌     |
| Invite member   |  ✅   |   ❌    |    ❌     |
| Resend invite   |  ✅   |   ❌    |    ❌     |
| Update role     |  ✅   |   ❌    |    ❌     |
| Update status   |  ✅   |   ❌    |    ❌     |
| Deactivate user |  ✅   |   ❌    |    ❌     |

**Implementation**: `services/management.ts` — `requireAdmin()` guard on all functions. Database RLS: `profiles_admin_insert/update/delete` policies.

### Reference Data (Applications, Modules, Features, Environments, Releases)

| Action                 | ADMIN | QA_LEAD | QA_TESTER |
| ---------------------- | :---: | :-----: | :-------: |
| List all               |  ✅   |   ✅    |    ✅     |
| Create                 |  ✅   |   ❌    |    ❌     |
| Update                 |  ✅   |   ❌    |    ❌     |
| Delete                 |  ✅   |   ❌    |    ❌     |
| Toggle active          |  ✅   |   ❌    |    ❌     |
| Advance release status |  ✅   |   ❌    |    ❌     |

**Implementation**: `services/management.ts` — `requireAdmin()` guard. Database RLS: `applications_insert/update/delete` with role check.

### Scenarios

| Action      | ADMIN | QA_LEAD | QA_TESTER |
| ----------- | :---: | :-----: | :-------: |
| Read list   |  ✅   |   ✅    |    ✅     |
| Read detail |  ✅   |   ✅    |    ✅     |
| Create      |  ✅   |   ✅    |    ❌     |
| Update      |  ✅   |   ✅    |    ❌     |
| Delete      |  ✅   |   ✅    |    ❌     |
| Search      |  ✅   |   ✅    |    ✅     |

**Implementation**: `services/scenarios.ts`. Database RLS: `test_scenarios_insert/update/delete` requires `ADMIN` or `QA_LEAD`.

### Plans

| Action      | ADMIN | QA_LEAD | QA_TESTER |
| ----------- | :---: | :-----: | :-------: |
| Read list   |  ✅   |   ✅    |    ✅     |
| Read detail |  ✅   |   ✅    |    ✅     |
| Create      |  ✅   |   ✅    |    ❌     |
| Update      |  ✅   |   ✅    |    ❌     |
| Delete      |  ✅   |   ✅    |    ❌     |

**Implementation**: `services/plans.ts`. Database RLS: `test_plans_insert/update/delete` requires `ADMIN` or `QA_LEAD`.

### Runs

| Action         | ADMIN | QA_LEAD |   QA_TESTER   |
| -------------- | :---: | :-----: | :-----------: |
| Read list      |  ✅   |   ✅    |      ✅       |
| Read detail    |  ✅   |   ✅    | ✅ (assigned) |
| Create         |  ✅   |   ✅    |      ❌       |
| Update status  |  ✅   |   ✅    |      ❌       |
| Assign testers |  ✅   |   ✅    |      ❌       |

**Implementation**: `services/runs.ts`. Database RLS: `test_runs_insert/update/delete` requires `ADMIN` or `QA_LEAD`. Execution read uses `can_execute_run()`.

### Executions

| Action          | ADMIN | QA_LEAD |     QA_TESTER      |
| --------------- | :---: | :-----: | :----------------: |
| Read list       |  ✅   |   ✅    | ✅ (assigned runs) |
| Read detail     |  ✅   |   ✅    | ✅ (assigned runs) |
| Save status     |  ✅   |   ✅    | ✅ (assigned runs) |
| Upload evidence |  ✅   |   ✅    | ✅ (assigned runs) |

**Implementation**: `services/executions.ts`. Database RLS: `test_executions_update` uses `can_execute_run()`. Storage policy verifies run membership.

### Evidence (Attachments)

| Action     | ADMIN | QA_LEAD |     QA_TESTER      |
| ---------- | :---: | :-----: | :----------------: |
| Upload     |  ✅   |   ✅    | ✅ (assigned runs) |
| Download   |  ✅   |   ✅    | ✅ (assigned runs) |
| Delete own |  ✅   |   ✅    |         ✅         |
| Delete any |  ✅   |   ❌    |         ❌         |

**Implementation**: `services/attachments.ts`. Storage policies verify execution membership.

### Findings (Failures)

| Action    | ADMIN | QA_LEAD |       QA_TESTER        |
| --------- | :---: | :-----: | :--------------------: |
| Read list |  ✅   |   ✅    |           ✅           |
| Create    |  ✅   |   ✅    |  ✅ (own executions)   |
| Update    |  ✅   |   ✅    | ✅ (own or ADMIN/LEAD) |
| Delete    |  ✅   |   ✅    |           ❌           |

**Implementation**: `services/findings.ts`. Database RLS: `failures_insert` requires `created_by = auth.uid()`. `failures_update` requires role OR ownership.

### Feedback

| Action    | ADMIN | QA_LEAD |       QA_TESTER        |
| --------- | :---: | :-----: | :--------------------: |
| Read list |  ✅   |   ✅    |           ✅           |
| Create    |  ✅   |   ✅    |  ✅ (own executions)   |
| Update    |  ✅   |   ✅    | ✅ (own or ADMIN/LEAD) |
| Delete    |  ✅   |   ✅    |           ❌           |

**Implementation**: `services/findings.ts`. Database RLS: `feedback_insert` requires `created_by = auth.uid()`. `feedback_update` requires role OR ownership.

### Board (Work Items)

| Action      | ADMIN | QA_LEAD | QA_TESTER |
| ----------- | :---: | :-----: | :-------: |
| Read list   |  ✅   |   ✅    |    ✅     |
| Move item   |  ✅   |   ✅    |    ❌     |
| Create item |  ✅   |   ✅    |    ❌     |

**Implementation**: `services/board.ts`. Database RLS: `qa_work_items_insert/update/delete` requires `ADMIN` or `QA_LEAD`.

### Reports

| Action      | ADMIN | QA_LEAD | QA_TESTER |
| ----------- | :---: | :-----: | :-------: |
| Read list   |  ✅   |   ✅    |    ✅     |
| Read detail |  ✅   |   ✅    |    ✅     |
| Generate    |  ✅   |   ✅    |    ❌     |
| Review      |  ✅   |   ✅    |    ❌     |
| Approve     |  ✅   |   ❌    |    ❌     |
| View PDF    |  ✅   |   ✅    |    ✅     |

**Implementation**: `services/reports.ts`.

- `next_report_number()` RPC requires `ADMIN` or `QA_LEAD`
- Report insert policy requires `ADMIN` or `QA_LEAD`
- `approveReport()` enforces: REVIEWED_BY → ADMIN or QA_LEAD; APPROVED_BY → ADMIN only
- Storage read: any authenticated user
- Storage insert: ADMIN or QA_LEAD only

### Audit Events

| Action | ADMIN | QA_LEAD | QA_TESTER |
| ------ | :---: | :-----: | :-------: |
| Read   |  ✅   |   ✅    | ✅ (own)  |
| Create |  ✅   |   ✅    | ✅ (own)  |

**Implementation**: Database RLS: `audit_read` requires role OR `actor_id = auth.uid()`.

## Defense in Depth

Three layers of authorization enforcement:

### 1. UI Layer (Navigation)

Components conditionally render based on role:

```typescript
// app/(dashboard)/layout.tsx
if (profile.role !== "ADMIN") {
  // Hide management nav items
}
```

### 2. Server Layer (Service Functions)

All mutations validate:

```typescript
// services/management.ts
async function requireAdmin() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single()
  if (profile?.role !== "ADMIN")
    throw new ManagementMutationError("Only administrators...", "FORBIDDEN")
}
```

### 3. Database Layer (RLS)

Row Level Security policies enforced per-request:

```sql
-- Always active, cannot be bypassed by application code
create policy profiles_admin_insert on profiles
  for insert to authenticated
  with check ((select private.has_role(array['ADMIN'])));
```

## Security Definer Functions

Critical functions use `SECURITY DEFINER` to run with elevated privileges:

| Function                         | Purpose                           | Security Model                       |
| -------------------------------- | --------------------------------- | ------------------------------------ |
| `private.current_user_role()`    | Get caller's role                 | Security definer, strict search_path |
| `private.has_role()`             | Role check                        | Security definer                     |
| `private.can_execute_run()`      | Run access check                  | Security definer                     |
| `private.can_access_execution()` | Execution access check            | Security definer                     |
| `private.guard_profile_role()`   | Prevent unauthorized role changes | Trigger, security definer            |

All are revoked from public/anon and only granted to authenticated.

## Storage Authorization

### qa-evidence Bucket

- **Read**: Verified via `can_execute_run()` — must be member of the run's execution
- **Insert**: Must belong to execution and be uploader
- **Delete**: Owner OR (ADMIN/QA_LEAD)

### qa-reports Bucket

- **Read**: Any authenticated user (private bucket, signed URLs)
- **Insert**: ADMIN or QA_LEAD only

## Password & Session Security

- Passwords are managed by Supabase Auth (bcrypt hashed)
- Sessions use HTTP-only cookies
- `signOut({ scope: "global" })` clears all auth cookies
- Service role key (`SUPABASE_SECRET_KEY`) is server-only, never exposed to client

## Inactive User Handling

Users with `status = 'INACTIVE'` in the `profiles` table:

- Can still authenticate via Supabase Auth
- Are redirected to `/access?reason=inactive` by `getProtectedRouteRedirect()`
- Cannot access any QA Hub features

## Unprovisioned User Handling

Users who have authenticated but have no `profiles` row:

- Redirected to `/access?reason=unprovisioned`
- Cannot access any QA Hub features
- Must be invited by ADMIN to create a profile
