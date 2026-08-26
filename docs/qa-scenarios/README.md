# QA Scenario Catalog

Purpose:
Manual QA scenario source for the six CSSI applications. These catalogs serve as the reviewed source for later import into the QA Hub database.

## Apps

- [Portal](./portal.md) — Authentication, user management, role management, app switcher, notifications, account settings, admin panel
- [CRM](./crm.md) — Accounts, contacts, leads, prospects, stock, search/filters/pagination, permissions
- [Flowra](./flowra.md) — Opening Account workflow (6-step form), draft/autosave, validation, submission, detail view
- [Daily Operation](./daily-operation.md) — Today workspace, approvals, history, IT config management
- [ITQM](./itqm.md) — Development request lifecycle, issue tracker, kanban board, configuration
- [Intranet](./intranet.md) — Announcements, regulations, admin panel, notifications

## How QA Should Use This Catalog

1. **Assign by application**: QA Leads assign testers to specific application catalogs based on testing cycles.
2. **Follow the scenario ID**: Each scenario has a unique ID (e.g., `QA-PORTAL-AUTH-001`) for tracking and reporting.
3. **Execute in priority order**: Start with Critical and High priority scenarios first.
4. **Record results**: Log Pass/Fail/Blocked for each scenario with notes for failures.
5. **Reference the source**: If a scenario reveals a bug, reference the scenario ID in the bug report.
6. **Check implementation status**: Each catalog includes an Implementation Status section indicating whether features are READY, LIMITED, MOCK, or STUB.
7. **Update status**: Once a catalog is reviewed and verified against the live system, update its status from DRAFT to REVIEWED.

## Scenario-Writing Standard

All scenarios follow these principles:

- **User perspective**: Written from the end-user's point of view, not the developer's.
- **Business-readable**: No technical jargon, API endpoints, or implementation details in the scenario steps.
- **Outcome-focused**: Expected Results describe what the user observes, not internal state changes.
- **Concise**: Steps are minimal but complete; no unnecessary detail.
- **Observable**: Every expected result must be something a human can verify by looking at the screen.
- **Stable IDs**: Scenario IDs use the format `QA-<APP>-<MODULE>-<NNN>` and do not change.

### Structure

Each scenario contains:

- **ID** — Unique stable identifier
- **Scenario title** — One-line description of what is being tested
- **Purpose** — Why this test matters
- **Preconditions** — What must be true before the test
- **Steps** — Numbered actions the tester performs
- **Expected Result** — What the tester should observe
- **Priority** — Critical / High / Medium / Low
- **Category** — Happy Path / Validation / Negative / Permission / Edge Case / Integration / etc.

## Status of Each Application

| Application     |  Status  | Modules | Features | Scenarios | DB Status   |
| --------------- | :------: | ------: | -------: | --------: | ----------- |
| Portal          | REVIEWED |      10 |       13 |        60 | ✅ Imported |
| CRM             | REVIEWED |       9 |        9 |        57 | ✅ Imported |
| Flowra          | REVIEWED |      12 |       12 |        73 | ✅ Imported |
| Daily Operation | REVIEWED |       5 |        5 |        36 | ✅ Imported |
| ITQM            | REVIEWED |       8 |        8 |        54 | ✅ Imported |
| Intranet        | REVIEWED |       8 |        8 |        50 | ✅ Imported |
| **Total**       |          |  **52** |   **55** |   **330** |             |

### Status Definitions

- **DRAFT**: Generated/initial catalog, still requires QA review against live system.
- **REVIEWED**: Validated against actual product behavior, ready for QA execution.
- **IMPORTED**: Taxonomy approved and imported into QA Hub database via `scripts/import-qa-catalog.ts`.

See [IMPORT.md](./IMPORT.md) for import details and re-import workflow.

## Implementation Status Legend

Each catalog includes an Implementation Status section with the following meanings:

- **READY**: Feature is fully implemented and ready for testing.
- **LIMITED**: Feature works but has known constraints (e.g., local-only storage, disabled in production).
- **MOCK**: Feature uses mock data when backend is unavailable.
- **STUB**: Feature is a placeholder with no functional implementation.

## Terminology

| Term            | Definition                                                                                |
| --------------- | ----------------------------------------------------------------------------------------- |
| **OA**          | Opening Account — the primary workflow in Flowra                                          |
| **PIC**         | Person In Charge — the user assigned to complete a development task in ITQM               |
| **SSO**         | Single Sign-On — Portal authenticates users once; sibling apps trust the Portal session   |
| **RBAC**        | Role-Based Access Control — permissions are assigned to roles, roles to users             |
| **Module**      | A logical grouping of pages/features within an application (e.g., "Accounts", "Contacts") |
| **Action**      | A permission type within a module (READ, CREATE, UPDATE, DELETE, APPROVE, REJECT)         |
| **Draft**       | Unsaved local form data; may be lost on page refresh depending on the application         |
| **Autosave**    | Automatic periodic saving of form data                                                    |
| **Happy Path**  | The normal, expected flow where everything works correctly                                |
| **Negative**    | Testing error conditions, invalid input, or failure scenarios                             |
| **Edge Case**   | Unusual but possible scenarios that may reveal hidden bugs                                |
| **Integration** | Testing behavior that spans multiple applications or systems                              |
| **Permission**  | Testing access control ��� who can see what and who can do what                           |

---

> **Note**: All scenarios in this catalog are derived from the actual implemented code in each application repository. Features not present in the source code are not included. Mock/stub implementations are noted in each application's coverage gaps section.
