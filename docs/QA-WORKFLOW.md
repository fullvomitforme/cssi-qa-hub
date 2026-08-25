# QA Workflow Guide

A user-friendly guide for QA team members using CSSI QA Hub.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Scenarios](#scenarios)
3. [Test Plans](#test-plans)
4. [Test Runs](#test-runs)
5. [Executing Tests](#executing-tests)
6. [Recording Results](#recording-results)
7. [Evidence & Findings](#evidence--findings)
8. [Retesting](#retesting)
9. [QA Board](#qa-board)
10. [Reports](#reports)
11. [Overview Dashboard](#overview-dashboard)

---

## Getting Started

### Logging In

1. Navigate to the QA Hub URL
2. Enter your email and password
3. Click **Sign In**

If you haven't received an invitation yet, contact your QA administrator.

### Your Profile

Your role determines what you can do:

- **QA Tester** — Execute tests, record results, upload evidence, create feedback
- **QA Lead** — All tester actions plus manage scenarios, plans, runs, and review reports
- **Administrator** — Full access plus member management and reference data

---

## Scenarios

Scenarios are reusable test definitions. They contain steps, expected results, and metadata.

### Source of Truth: Markdown Catalog

Before importing into QA Hub, all scenarios live as reviewed Markdown files in `docs/qa-scenarios/`. Each application has its own catalog file:

| File | Application | Scenarios |
| ---- | ----------- | --------: |
| [`portal.md`](../qa-scenarios/portal.md) | Portal — Auth, users, roles, switcher, notifications | 60 |
| [`crm.md`](../qa-scenarios/crm.md) | CRM — Accounts, contacts, leads, prospects, stock | 57 |
| [`flowra.md`](../qa-scenarios/flowra.md) | Flowra — Opening Account workflow | 73 |
| [`daily-operation.md`](../qa-scenarios/daily-operation.md) | Daily Operation — Today, approvals, history | 36 |
| [`itqm.md`](../qa-scenarios/itqm.md) | ITQM — Dev requests, issues, config | 54 |
| [`intranet.md`](../qa-scenarios/intranet.md) | Intranet — Announcements, regulations, admin | 50 |

**Total: 330 scenarios across 6 applications.**

All scenarios are currently in **DRAFT** status and must be reviewed against the live system before import. See [`docs/qa-scenarios/README.md`](../qa-scenarios/README.md) for usage guidance and [`docs/qa-scenarios/REVIEW.md`](../qa-scenarios/REVIEW.md) for the review report.

### Importing Scenarios from Catalog

Use the Admin import flow to bulk-create scenarios from the Markdown catalogs:

1. Navigate to **Management** → **Scenarios**
2. Click **Import from Catalog** (or use the CSV/Markdown import wizard)
3. Select the application and catalog file (`docs/qa-scenarios/<app>.md`)
4. Review the preview — each scenario maps to: title, description, priority, category, tags
5. Confirm import — scenarios are created with steps extracted from the catalog
6. Verify a sample of imported scenarios against the live system

**Import notes:**
- All 330 scenarios are DRAFT — do not import all at once. Import per-application as QA Leads validate them.
- After import, update the catalog status from DRAFT → REVIEWED in `docs/qa-scenarios/README.md`.
- Do not re-import into an existing app unless you clear old scenarios first (to avoid duplicates).

### Creating a Scenario (QA Lead/Admin)

1. Navigate to **Scenarios** → **New Scenario**
2. Select the application, module, and feature
3. Fill in:
   - **Title** — Short descriptive name
   - **Description** — Context for the test
   - **Preconditions** — What must be true before testing
   - **Test Type** — Happy path, validation, negative, etc.
   - **Priority** — P0 (critical) to P3 (low)
   - **Expected Result** — What should happen
4. Add **Steps**:
   - Step instruction (required)
   - Expected result per step (optional)
   - Position is automatic
5. Add **Tags** (optional) — lowercase keywords for filtering
6. Click **Save**

### Editing a Scenario

1. Open the scenario detail page
2. Click **Edit**
3. Modify fields as needed
4. Click **Save**

**Important**: Editing a scenario does NOT affect existing executions. Executions snapshot the scenario state at creation time.

### Searching Scenarios

Use the search bar to find scenarios by:

- Title or description (full-text search)
- Application, module, feature filters
- Test type
- Priority
- Date range (updated in last 3/7/30 days)

---

## Test Plans

Test plans organize scenarios for a specific release and assign testers.

### Creating a Plan (QA Lead/Admin)

1. Navigate to **Plans** → **New Plan**
2. Fill in:
   - **Name** — Plan identifier
   - **Application** — Select from dropdown
   - **Release** — Select active release
   - **Environment** — Usually UAT
   - **Owner** — Yourself or another lead
   - **Start Date** / **Target Completion**
3. Add **Scenarios**:
   - Search and select scenarios from the application
   - Position is automatic
4. **Assign Testers**:
   - Select QA testers from the dropdown
   - At least one assignment is required
5. Set **Status**: DRAFT initially
6. Click **Save**

### Plan Status Flow

```
DRAFT → READY → ACTIVE → COMPLETED
                        ↘ ARCHIVED
```

- **DRAFT** — Being prepared, not ready for execution
- **READY** — Complete and ready to start
- **ACTIVE** — Currently in progress
- **COMPLETED** — All scenarios executed
- **ARCHIVED** — Closed and preserved for history

---

## Test Runs

Test runs are concrete execution instances against a specific build.

### Creating a Run (QA Lead/Admin)

1. Navigate to **Runs** → **New Run**
2. Select the source **Test Plan**
3. Fill in:
   - **Name** — Run identifier
   - **Build** — Build number or identifier
4. Assign **Testers** (if not inherited from plan)
5. Click **Save**

The system automatically creates execution records for all scenarios in the plan.

### Run Status Flow

```
NOT_STARTED → IN_PROGRESS → COMPLETED
              ↗ BLOCKED ↗ CANCELLED
```

- **IN_PROGRESS** — Testers are actively executing
- **BLOCKED** — Waiting on dependency
- **COMPLETED** — All scenarios executed
- **CANCELLED** — Stopped before completion

---

## Executing Tests

### Opening the Execution Workspace

1. Navigate to **Runs**
2. Click on a run
3. Click **Execute** to open the workspace

### Recording Results

For each scenario execution:

1. Review the **steps** (copied from scenario)
2. For each step, record:
   - **Status**: PASS / FAIL / SKIPPED
   - **Actual Result** (if different from expected)
3. Set the **execution outcome**:
   - **PASS** — All steps passed
   - **FAIL** — One or more steps failed
   - **BLOCKED** — Cannot complete due to dependency
   - **SKIPPED** — Not applicable for this run

### Step Status Meanings

| Status  | When to Use                              |
| ------- | ---------------------------------------- |
| PASS    | Step completed as expected               |
| FAIL    | Step did not meet expected result        |
| SKIPPED | Step not applicable or condition not met |

---

## Evidence & Findings

### Uploading Evidence

When a test fails or produces noteworthy output:

1. In the execution view, scroll to **Evidence**
2. Click **Upload Evidence**
3. Select file(s):
   - Images: PNG, JPEG, WebP
   - Documents: PDF, TXT, CSV, JSON
   - Video: MP4
4. Max file size: 50 MB
5. Click **Upload**

Evidence is linked to the execution and visible to all run participants.

### Creating Failures

Failures are formal bug reports:

1. In the execution view, click **Create Failure**
2. Fill in:
   - **Severity** — CRITICAL, HIGH, MEDIUM, LOW
   - **Title** — Brief description of the issue
   - **Description** — Detailed explanation
   - **Bug Reference** — Link to tracking system (optional)
   - **Retest Status** — AWAITING_FIX (default)
3. Click **Save**

### Creating Feedback

Feedback is general notes on an execution:

1. Click **Add Feedback**
2. Select type: BUG, UX, COPY, IMPROVEMENT, QUESTION
3. Fill in title and description
4. Click **Save**

**Note**: You can only create feedback on executions you have access to (your assigned runs).

---

## Retesting

When a fix is deployed and you need to retest:

1. Navigate to the execution
2. Click **Retest**
3. The system creates a new **immutable attempt** with:
   - Incremented attempt number
   - Current build version
   - New test results
4. Update status and results as needed
5. Click **Save**

**Historical Integrity**: Each attempt is permanently recorded. You cannot modify or delete previous attempts. This preserves the complete retest history.

---

## QA Board

The board shows work items across releases with live counters.

### Board Status Flow

```
BACKLOG → READY_TO_TEST → IN_TESTING → BLOCKED
                                      ↘ FAILED_NEED_FIX → RETEST → PASSED → DONE
```

### Viewing the Board

1. Navigate to **Board**
2. Items are grouped by release
3. Each card shows:
   - Title, priority, assignee
   - Due date
   - Live counters: total scenarios, passed, failed, blocked, untested

### Moving Items

Only QA Leads and Administrators can move items:

1. Click on a card
2. Select new status from dropdown
3. The change is logged immutably

**Note**: Board counters are derived from actual execution data, not manually entered.

---

## Reports

Reports document the testing outcome for a release.

### Generating a Report (QA Lead/Admin)

1. Navigate to **Reports**
2. Click **Generate Report**
3. Select a completed test run
4. Set:
   - **Result**: PASS, CONDITIONAL_PASS, or FAIL
   - **Conclusion**: Summary of findings
5. Click **Generate**

The system:

- Allocates a unique report number (e.g., `QA-PORTAL-2026-0001`)
- Creates an immutable snapshot of the report
- Generates a PDF
- Stores the PDF in private storage
- Records `PREPARED_BY` approval

### Approval Workflow

Reports follow a three-stage approval process:

```
FINALIZED → PREPARED_BY → REVIEWED_BY → APPROVED_BY
```

1. **PREPARED_BY** — Auto-recorded when report is generated
2. **REVIEWED_BY** — QA Lead or Admin reviews and signs off
3. **APPROVED_BY** — Administrator gives final approval

### Viewing Reports

1. Navigate to **Reports**
2. Click on a report to see:
   - Report number and result
   - Application, release, environment
   - Test statistics
   - Module breakdown
   - Primary failure details
   - Approval history
3. Click **Download PDF** to get the signed PDF

**PDF Access**: PDFs are stored privately. You need a signed URL (1-hour expiry) to download.

---

## Overview Dashboard

The overview provides a high-level view of QA status.

### Metrics

| Metric          | Description                        |
| --------------- | ---------------------------------- |
| Total Scenarios | All active scenarios in the system |
| Tested          | Scenarios with recorded results    |
| Passed          | Scenarios that passed              |
| Failed          | Scenarios that failed              |
| Blocked         | Scenarios blocked by dependencies  |
| Not Tested      | Remaining scenarios                |

### Applications View

See progress per application:

- Coverage percentage
- Pass rate
- Failed/blocked/not tested counts

### Trend Chart

Shows daily pass/fail/block counts for the last 7 days.

### Recent Runs

Lists the 5 most recent test runs with progress.

### Top Failures

Shows the 5 most recent open/in-progress failures.

### Filtering

Apply filters to narrow the view:

- **Release** — Filter by specific release
- **Environment** — Filter by environment
- **Date Range** — Filter by testing period

---

## Quick Reference

### Keyboard Shortcuts

- `⌘K` — Quick search (scenarios, plans, runs)
- `Esc` — Close modals and dialogs

### Common Actions

| Action          | Who Can Do It       |
| --------------- | ------------------- |
| Create scenario | QA Lead, Admin      |
| Edit scenario   | QA Lead, Admin      |
| Create plan     | QA Lead, Admin      |
| Execute tests   | Any assigned tester |
| Upload evidence | Any run participant |
| Create failure  | Any run participant |
| Generate report | QA Lead, Admin      |
| Approve report  | Admin only          |

### Status Meanings

| Status      | Meaning               |
| ----------- | --------------------- |
| DRAFT       | Being prepared        |
| READY       | Ready for execution   |
| ACTIVE      | Currently running     |
| IN_PROGRESS | Testing underway      |
| COMPLETED   | All testing done      |
| BLOCKED     | Waiting on dependency |
| CANCELLED   | Stopped intentionally |
| PASS        | Test passed           |
| FAIL        | Test failed           |
| SKIPPED     | Not applicable        |
