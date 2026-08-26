# QA Test Plans

Canonical smoke and regression test plans for all six CSSI applications, built from the imported 330-scenario QA catalog.

## Smoke Selection Criteria

Each smoke plan selects scenarios that validate whether the application is **fundamentally usable**:

1. **Critical scenarios first** — any scenario marked Critical is included
2. **Core happy-path high-priority flows** — essential create/read/update/submit workflows
3. **Authentication/access control** — sign-in, permission checks where applicable
4. **Primary business workflow** — the main end-to-end flow the application exists for
5. **Essential CRUD** — create, view, edit for the primary entity
6. **Critical approval/submission** — submit, approve, reject for workflow apps
7. **One key permission scenario** — verifies RBAC is enforced
8. **Excluded**: cosmetic, edge-case, exhaustive validation, responsive, low-risk, pagination, search/filter refinements

---

## Portal Smoke (9 scenarios)

| Code                  | Scenario                                                   | Priority | Reason                                                  |
| --------------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------- |
| QA-PORTAL-AUTH-001    | User can sign in with correct credentials                  | Critical | Core authentication — entry point for all users         |
| QA-PORTAL-AUTH-005    | User session expires and redirects to login                | Critical | Session security — ensures expired sessions are handled |
| QA-PORTAL-AUTH-010    | User must set a new password on first login                | Critical | First-login flow — critical for new user onboarding     |
| QA-PORTAL-AUTH-003    | User can sign out successfully                             | High     | Core auth lifecycle                                     |
| QA-PORTAL-USER-001    | Administrator can create a new user                        | High     | Core user management CRUD                               |
| QA-PORTAL-ROLE-001    | Administrator can create a new role                        | High     | Core role management — foundation of RBAC               |
| QA-PORTAL-APP-002     | Signed-in user can open CRM without signing in again       | High     | SSO integration — cross-app session trust               |
| QA-PORTAL-ACCOUNT-002 | User can change their password                             | High     | Core account self-service                               |
| QA-PORTAL-APP-001     | User sees only applications they have permission to access | High     | Core access control — verifies RBAC enforcement         |

## Portal Regression (60 scenarios)

All 60 Portal scenarios included. Full coverage across Authentication (11), User Management (10), Role Management (8), Application Switcher (6), Notifications (5), Account Settings (8), Admin Dashboard (3), Audit Logs (3), System Announcements (5), Cross-Application/SSO (1).

---

## CRM Smoke (8 scenarios)

| Code               | Scenario                                              | Priority | Reason                                        |
| ------------------ | ----------------------------------------------------- | -------- | --------------------------------------------- |
| QA-CRM-PERM-001    | User without CRM permission cannot access CRM         | Critical | Access control — first line of defense        |
| QA-CRM-ACCT-001    | User can create a new account with valid information  | High     | Primary entity CRUD — core business object    |
| QA-CRM-ACCT-004    | User can open an account detail page                  | High     | Primary entity read — detail view             |
| QA-CRM-ACCT-005    | User can edit an existing account                     | High     | Primary entity update                         |
| QA-CRM-CONTACT-001 | User can create a contact with valid information      | High     | Secondary entity CRUD                         |
| QA-CRM-LEAD-001    | User can create a lead with valid information         | High     | Lead management — core pipeline flow          |
| QA-CRM-SEARCH-001  | Global search finds records across the current module | High     | Core search functionality                     |
| QA-CRM-PERM-005    | Admin user can access all CRM modules                 | High     | Admin access — verifies full permission scope |

## CRM Regression (57 scenarios)

All 57 CRM scenarios included. Full coverage across Dashboard (6), Accounts (9), Contacts (9), Leads (7), Prospects (7), Stock (5), Search & Filters (5), Pagination (3), Permissions (6).

---

## Flowra Smoke (10 scenarios)

| Code                | Scenario                                                      | Priority | Reason                                              |
| ------------------- | ------------------------------------------------------------- | -------- | --------------------------------------------------- |
| QA-FLOWRA-VAL-001   | User cannot submit with required fields missing from any step | Critical | Validation — prevents incomplete submissions        |
| QA-FLOWRA-VAL-003   | User cannot submit if no primary email is marked              | Critical | Validation — email is required for account creation |
| QA-FLOWRA-SUB-001   | User can submit a complete Opening Account application        | Critical | Primary business flow — the core OA submission      |
| QA-FLOWRA-PROD-001  | User can fill product information successfully                | High     | Step 1 of OA workflow — product setup               |
| QA-FLOWRA-INST-001  | User can fill institution information                         | High     | Step 2 of OA workflow — institution details         |
| QA-FLOWRA-PERS-001  | User can fill personal information with all required fields   | High     | Step 3 of OA workflow — personal data               |
| QA-FLOWRA-DRAFT-001 | User's draft is saved automatically as they fill the form     | High     | Draft/autosave — critical for long multi-step forms |
| QA-FLOWRA-DRAFT-002 | User can leave and continue a saved draft later               | High     | Draft persistence — resume workflow                 |
| QA-FLOWRA-OA-001    | User can view the list of Opening Accounts                    | High     | OA list view — primary navigation                   |
| QA-FLOWRA-PERM-001  | User without OA permission cannot access the OA module        | High     | Access control — RBAC enforcement                   |

## Flowra Regression (73 scenarios)

All 73 Flowra scenarios included. Full coverage across Opening Account List (6), Product Form (8), Institution Form (5), Personal Form (10), Spouse/Parents Form (4), Bank Form (5), Financial Form (5), Draft & Autosave (7), Validation (8), Submission (6), Detail View (5), Permissions (4).

---

## Daily Operation Smoke (8 scenarios)

| Code                  | Scenario                                                      | Priority | Reason                                      |
| --------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------- |
| QA-DAILY-TODAY-001    | User sees today's assigned checklist                          | High     | Core workspace — the primary daily view     |
| QA-DAILY-TODAY-003    | User can check an item as complete                            | High     | Core action — marking work done             |
| QA-DAILY-TODAY-006    | User can submit completed work for approval                   | High     | Core submission workflow                    |
| QA-DAILY-APPROVAL-001 | Approver can view pending submissions                         | High     | Approval workflow — approver entry point    |
| QA-DAILY-APPROVAL-002 | Approver can approve a pending submission                     | High     | Approval action — core approval flow        |
| QA-DAILY-APPROVAL-003 | Approver can reject a submission with a reason                | High     | Rejection flow — requires reason capture    |
| QA-DAILY-PERM-001     | User without TODAY permission cannot access the Today page    | High     | Access control — RBAC enforcement           |
| QA-DAILY-PERM-006     | User without APPROVE permission cannot see the Approvals page | High     | Permission isolation — approver vs operator |

## Daily Operation Regression (36 scenarios)

All 36 Daily Operation scenarios included. Full coverage across Today Workspace (10), Approvals (8), History (5), IT Config (8), Permissions (5).

---

## ITQM Smoke (10 scenarios)

| Code                | Scenario                                                               | Priority | Reason                                        |
| ------------------- | ---------------------------------------------------------------------- | -------- | --------------------------------------------- |
| QA-ITQM-DEVREQ-001  | User can create a development request                                  | High     | Primary entity creation — core workflow entry |
| QA-ITQM-DEVREQ-005  | User can resubmit a rejected request                                   | High     | Resubmission flow — retry after rejection     |
| QA-ITQM-DEVREQ-006  | User can view the request detail with status, assignments, and history | High     | Request detail — status tracking              |
| QA-ITQM-APPROVE-001 | Division approver can view pending requests                            | High     | Approval workflow — approver entry            |
| QA-ITQM-APPROVE-002 | Division approver can approve a request                                | High     | Approval action                               |
| QA-ITQM-ACCEPT-001  | IT acceptor can view requests pending acceptance                       | High     | IT acceptance — second approval gate          |
| QA-ITQM-ACCEPT-002  | IT acceptor can accept and assign PICs to a request                    | High     | PIC assignment — work delegation              |
| QA-ITQM-DONE-001    | PIC can view their assigned tasks in Done Report                       | High     | Done Report — task tracking                   |
| QA-ITQM-DONE-002    | PIC can mark their assignment as done                                  | High     | Completion action                             |
| QA-ITQM-PERM-001    | User without development permission cannot see Development menu        | High     | Access control — RBAC enforcement             |

## ITQM Regression (54 scenarios)

All 54 ITQM scenarios included. Full coverage across Development Request (10), Division Approval (7), IT Acceptance (7), Done Report (8), Issue Tracker (9), Configuration (4), Development Report (4), Permissions (5).

---

## Intranet Smoke (8 scenarios)

| Code                        | Scenario                                                        | Priority | Reason                                            |
| --------------------------- | --------------------------------------------------------------- | -------- | ------------------------------------------------- |
| QA-INTRANET-SYSANN-001      | Administrator can create a system announcement                  | High     | Primary admin action — announcement creation      |
| QA-INTRANET-SYSANN-006      | Normal user cannot create, edit, or delete system announcements | High     | Permission enforcement — admin vs normal user     |
| QA-INTRANET-REG-001         | User can view regulations by category                           | High     | Core content — regulation browsing                |
| QA-INTRANET-REG-005         | User can only see regulations matching their roles              | Critical | Role-based content visibility — security-critical |
| QA-INTRANET-REG-004         | User can create a regulation with role visibility settings      | High     | Regulation creation — admin workflow              |
| QA-INTRANET-INTRANETANN-001 | User with permission can create an intranet announcement        | High     | Intranet announcements — division-level content   |
| QA-INTRANET-PERM-001        | User without Intranet permission cannot access Intranet         | High     | Access control — first line of defense            |
| QA-INTRANET-ACCOUNT-002     | User can change their password                                  | High     | Account self-service                              |

## Intranet Regression (50 scenarios)

All 50 Intranet scenarios included. Full coverage across Dashboard (5), System Announcements (7), Intranet Announcements (6), Regulations (10), Notifications (5), Admin Panel (8), Account Settings (5), Permissions (4).

---

## Summary

| Application     |  Smoke | Regression |
| --------------- | -----: | ---------: |
| Portal          |      9 |         60 |
| CRM             |      8 |         57 |
| Flowra          |     10 |         73 |
| Daily Operation |      8 |         36 |
| ITQM            |     10 |         54 |
| Intranet        |      8 |         50 |
| **Total**       | **53** |    **330** |

## Verification

- No smoke scenario belongs to another app ✅
- No duplicate scenario in any plan ✅
- Every smoke scenario exists in imported DB catalog ✅
- Every regression scenario exists in imported DB catalog ✅
- Smoke scenarios are a subset of corresponding regression plan ✅
- Regression plans cover 100% of each app's catalog ✅
