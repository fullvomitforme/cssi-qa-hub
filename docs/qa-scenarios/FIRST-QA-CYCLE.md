# First Real QA Cycle — Manual Execution Plan

> This document defines the recommended first manual QA cycle using the
> imported catalog and canonical test plans. **Do not create DB runs until
> blockers are resolved** (see Operational Readiness Report).

## Prerequisites (BLOCKERS)

Before starting, resolve:

1. **Real QA_TESTER account** — invite a real tester via the Admin panel.
2. **Environment URLs** — supply legitimate UAT/Staging URLs for each application.

## Recommended Execution Order

Smoke plans first (fast pass/fail), then regression for any app that passes smoke.

---

### 1. Portal Smoke

| Field | Value |
|-------|-------|
| Plan | Portal Smoke |
| Scenarios | 9 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER account active, environment accessible, Portal app deployed |
| Completion Criteria | All 9 scenarios PASS. Any FAIL blocks regression. |

**Scenarios:**
- AUTH-001 Sign in
- AUTH-005 Session expiry handling
- AUTH-010 First login flow
- AUTH-003 Sign out
- USER-001 Create user
- ROLE-001 Create role
- APP-002 SSO login
- ACCOUNT-002 Change password
- APP-001 RBAC visibility

---

### 2. CRM Smoke

| Field | Value |
|-------|-------|
| Plan | CRM Smoke |
| Scenarios | 8 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER active, CRM environment accessible |
| Completion Criteria | All 8 scenarios PASS. |

**Scenarios:**
- PERM-001 Access denied for unauthorized role
- ACCT-001 Create account
- ACCT-004 View account detail
- ACCT-005 Edit account
- CONTACT-001 Create contact
- LEAD-001 Create lead
- SEARCH-001 Global search
- PERM-005 Admin access

---

### 3. Flowra Smoke

| Field | Value |
|-------|-------|
| Plan | Flowra Smoke |
| Scenarios | 10 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER active, Flowra environment accessible |
| Completion Criteria | All 10 scenarios PASS. |

**Scenarios:**
- VAL-001 Required field validation
- VAL-003 Primary email validation
- SUB-001 Submit OA workflow
- PROD-001 Product form
- INST-001 Institution form
- PERS-001 Personal form
- DRAFT-001 Autosave draft
- DRAFT-002 Resume draft
- OA-001 OA list view
- PERM-001 Access control

---

### 4. Daily Operation Smoke

| Field | Value |
|-------|-------|
| Plan | Daily Operation Smoke |
| Scenarios | 8 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER active, Daily Operation environment accessible |
| Completion Criteria | All 8 scenarios PASS. |

**Scenarios:**
- TODAY-001 Checklist view
- TODAY-003 Check item
- TODAY-006 Submit
- APPROVAL-001 View pending approvals
- APPROVAL-002 Approve
- APPROVAL-003 Reject with reason
- PERM-001 Today access control
- PERM-002 Approval access control

---

### 5. ITQM Smoke

| Field | Value |
|-------|-------|
| Plan | ITQM Smoke |
| Scenarios | 10 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER active, ITQM environment accessible |
| Completion Criteria | All 10 scenarios PASS. |

**Scenarios:**
- DEVREQ-001 Create dev request
- DEVREQ-005 Resubmit request
- DEVREQ-006 View detail
- APPROVE-001 View pending approvals
- APPROVE-002 Approve
- ACCEPT-001 View pending acceptance
- ACCEPT-002 Accept + assign PIC
- DONE-001 View done tasks
- DONE-002 Mark done
- PERM-001 Dev access control

---

### 6. Intranet Smoke

| Field | Value |
|-------|-------|
| Plan | Intranet Smoke |
| Scenarios | 8 |
| Environment | (requires real URL) |
| Release | (requires real version/build) |
| QA Tester | (requires real QA_TESTER) |
| Entry Criteria | QA_TESTER active, Intranet environment accessible |
| Completion Criteria | All 8 scenarios PASS. |

**Scenarios:**
- SYSANN-001 Create system announcement
- SYSANN-006 Permission denied for non-admin
- REG-001 View regulations
- REG-005 Role-based visibility
- REG-004 Create regulation
- INTRANETANN-001 Intranet announcement
- PERM-001 Access control
- ACCOUNT-002 Change password

---

## After Smoke Phase

- **All 6 smoke plans pass (53/53)** → proceed to regression for each app.
- **Any smoke plan fails** → block regression for that app, file findings, do not proceed until fixed.

## Regression Phase

After all smoke passes, execute full regression in the same order:

1. Portal Regression (60 scenarios)
2. CRM Regression (57 scenarios)
3. Flowra Regression (73 scenarios)
4. Daily Operation Regression (36 scenarios)
5. ITQM Regression (54 scenarios)
6. Intranet Regression (50 scenarios)

Total: 330 scenarios across 6 applications.
