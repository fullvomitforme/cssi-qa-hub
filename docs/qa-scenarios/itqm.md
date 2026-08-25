# ITQM Manual QA Scenario Catalog

## Scope

ITQM (Information Technology Quality Management) manages the full lifecycle of IT development requests — from submission through approval, acceptance, execution, verification, and completion — plus an engineering issue tracker (Phase 1). This catalog covers the actual implementation in `cssi-itqm`, including the development request workflow, issue management, kanban board, and configuration.

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Development Request | Create, Edit, Resubmit, View Detail, List | 10 |
| Division Approval | Approve, Reject, View Detail | 7 |
| IT Acceptance | Accept & Assign, Reject, View Detail | 7 |
| Done Report | Mark Done, Verify, Override Done | 8 |
| Issue Tracker | Create, Edit, View, Kanban Board | 9 |
| Configuration | Request Types, System Types | 4 |
| Development Report | View, Filter, Search | 4 |
| Permissions | Module access, Workflow gating | 5 |
| **Total** | | **54** |

---

## Development Request

#### QA-ITQM-DEVREQ-001 — User can create a development request

**Purpose**
Confirm that a user can submit a new development request with required information.

**Preconditions**
- User has CREATE permission for the Development Request module.
- User is signed in with ITQM access.

**Steps**
1. Navigate to **Development > Request**.
2. Click **Create New Request**.
3. Fill in all required fields: subject, requirement description, request type, system type.
4. Save the request.

**Expected Result**
- Request is created successfully.
- Request appears in the list with status "Draft".
- User can view the request detail.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-002 — User cannot submit a request with required fields missing

**Purpose**
Confirm that validation blocks incomplete request submission.

**Preconditions**
- User has CREATE permission for the Development Request module.

**Steps**
1. Navigate to **Development > Request**.
2. Click **Create New Request**.
3. Leave required fields empty.
4. Attempt to save.

**Expected Result**
- Form validation catches missing required fields.
- Save is blocked until all required fields are filled.
- Error messages indicate which fields are required.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-DEVREQ-003 — User can edit a draft or revision request

**Purpose**
Confirm that a requester can modify their request while it is in draft or revision status.

**Preconditions**
- User has CREATE/UPDATE permission.
- A request exists in "Draft" or "Revision" status.

**Steps**
1. Navigate to **Development > Request**.
2. Open a draft or revision request.
3. Click Edit.
4. Modify the subject or requirement.
5. Save changes.

**Expected Result**
- Request is updated successfully.
- Status remains "Draft" or "Revision".
- Changes are reflected in the list and detail view.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-004 — User cannot edit a request that is not in draft or revision

**Purpose**
Confirm that requests in other statuses cannot be modified by the requester.

**Preconditions**
- A request exists in "Pending Division Approval" or later status.

**Steps**
1. Navigate to **Development > Request**.
2. Open a request that is not in draft or revision.
3. Look for the Edit button.

**Expected Result**
- Edit button is not visible or is disabled.
- User cannot modify the request.

**Priority**
High

**Category**
Permission

---

#### QA-ITQM-DEVREQ-005 — User can resubmit a rejected request

**Purpose**
Confirm that a request in "Revision" status can be resubmitted after corrections.

**Preconditions**
- User has CREATE permission.
- A request exists in "Revision" status.

**Steps**
1. Navigate to **Development > Request**.
2. Open the revision request.
3. Make necessary corrections.
4. Click **Resubmit**.
5. Observe the result.

**Expected Result**
- Request status changes to "Pending Division Approval".
- Resubmission is recorded in the history timeline.
- Request appears in the division approver's queue.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-006 — User can view the request detail with status, assignments, and history

**Purpose**
Confirm that the detail view shows complete request information.

**Preconditions**
- A request exists in the system.

**Steps**
1. Navigate to **Development > Request**.
2. Click on a request row.
3. Observe the detail modal.

**Expected Result**
- Detail shows: subject, requirement, type, system, status, attachments.
- Assignments section shows PICs, due dates, and their status.
- History timeline shows all status transitions with actor, role, note, and timestamp.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-007 — User can filter requests by status

**Purpose**
Confirm that status filtering works on the request list.

**Preconditions**
- Requests with different statuses exist.

**Steps**
1. Navigate to **Development > Request**.
2. Select a status filter.
3. Observe the filtered results.

**Expected Result**
- Only requests matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-008 — User can search requests by subject or requirement

**Purpose**
Confirm that search functionality finds requests by text match.

**Preconditions**
- Multiple requests exist.

**Steps**
1. Navigate to **Development > Request**.
2. Enter a search term in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results match the entered term against subject and requirement fields.
- Search updates in real time.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-009 — URL filters persist across page navigation

**Purpose**
Confirm that filter states sync to the URL and survive page refresh.

**Preconditions**
- User is on the Development Request page.

**Steps**
1. Apply several filters (status, type, system, date range).
2. Refresh the page.
3. Observe the filter state.

**Expected Result**
- Filters are restored from the URL.
- Displayed results match the applied filters.

**Priority**
Low

**Category**
Happy Path

---

#### QA-ITQM-DEVREQ-010 — Unsaved changes trigger a discard confirmation when leaving the form

**Purpose**
Confirm that navigating away from an unsaved form prompts for confirmation.

**Preconditions**
- User is filling out a new or edited request form.
- Changes have been made but not saved.

**Steps**
1. Fill in some fields on the request form.
2. Attempt to close the form or navigate away.
3. Observe the dialog.

**Expected Result**
- Confirmation dialog appears asking to save or discard changes.
- User can choose to stay, discard, or cancel.

**Priority**
Medium

**Category**
Happy Path

---

## Division Approval

#### QA-ITQM-APPROVE-001 — Division approver can view pending requests

**Purpose**
Confirm that the Approve page shows requests awaiting division approval.

**Preconditions**
- User has ITQM_DEVELOPMENT APPROVE permission.
- Requests in "Pending Division Approval" status exist.

**Steps**
1. Sign in as a division approver.
2. Navigate to **Development > Approve**.
3. Observe the list.

**Expected Result**
- Pending requests are displayed.
- Each entry shows subject, requester, type, system, and submission date.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-APPROVE-002 — Division approver can approve a request

**Purpose**
Confirm that approval transitions the request to the next stage.

**Preconditions**
- User has ITQM_DEVELOPMENT APPROVE permission.
- A request is in "Pending Division Approval" status.

**Steps**
1. Navigate to **Development > Approve**.
2. Find a pending request.
3. Click **Approve**.
4. Observe the result.

**Expected Result**
- Request status changes to "Pending IT Accept".
- Approval is recorded in the history timeline with actor name, role, and timestamp.
- Request appears in the IT Accept queue.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-APPROVE-003 — Division approver can reject a request with a note

**Purpose**
Confirm that rejection transitions the request to revision and sends a note to the requester.

**Preconditions**
- User has ITQM_DEVELOPMENT REJECT permission.
- A request is in "Pending Division Approval" status.

**Steps**
1. Navigate to **Development > Approve**.
2. Find a pending request.
3. Click **Reject**.
4. Enter a rejection note.
5. Confirm the rejection.

**Expected Result**
- Request status changes to "Revision".
- Rejection note is recorded in the history timeline.
- Requester can see the rejection reason in their request detail.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-APPROVE-004 — Division approver cannot reject without providing a note

**Purpose**
Confirm that rejection requires a mandatory note field.

**Preconditions**
- User has ITQM_DEVELOPMENT REJECT permission.
- A request is in "Pending Division Approval" status.

**Steps**
1. Navigate to **Development > Approve**.
2. Click Reject on a pending request.
3. Leave the note field empty.
4. Attempt to confirm rejection.

**Expected Result**
- System requires a rejection note.
- Rejection is blocked until a note is provided.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-APPROVE-005 — User cannot approve a request that is not in the correct status

**Purpose**
Confirm that approval is only available for requests in "Pending Division Approval" status.

**Preconditions**
- User has ITQM_DEVELOPMENT APPROVE permission.

**Steps**
1. Navigate to **Development > Approve**.
2. Look at requests in statuses other than "Pending Division Approval".
3. Check for approve buttons.

**Expected Result**
- Approve buttons are only visible for requests in "Pending Division Approval" status.
- Requests in other statuses do not show the approve action.

**Priority**
High

**Category**
Permission

---

#### QA-ITQM-APPROVE-006 — Division approver can view request detail from the Approve page

**Purpose**
Confirm that approvers can review request details before making a decision.

**Preconditions**
- User has ITQM_DEVELOPMENT APPROVE permission.
- A pending request exists.

**Steps**
1. Navigate to **Development > Approve**.
2. Click on a pending request row.
3. Observe the detail view.

**Expected Result**
- Detail modal opens showing full request information.
- History timeline is visible.
- Approve and Reject buttons are available in the detail view.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-APPROVE-007 — User without APPROVE permission cannot see the Approve page

**Purpose**
Confirm that non-approvers cannot access the division approval workflow.

**Preconditions**
- User does not have ITQM_DEVELOPMENT APPROVE permission.

**Steps**
1. Sign in as a user without approval permission.
2. Attempt to open the Approve page from navigation.
3. Attempt to open the Approve URL directly.

**Expected Result**
- Approve is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
Critical

**Category**
Permission

---

## IT Acceptance

#### QA-ITQM-ACCEPT-001 — IT acceptor can view requests pending acceptance

**Purpose**
Confirm that the Accept page shows requests awaiting IT acceptance.

**Preconditions**
- User has ITQM_DEVELOPMENT permission.
- Requests in "Pending IT Accept" status exist.

**Steps**
1. Sign in as an IT acceptor.
2. Navigate to **Development > Accept**.
3. Observe the list.

**Expected Result**
- Pending acceptance requests are displayed.
- Each entry shows subject, division approver, approval date, and type.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ACCEPT-002 — IT acceptor can accept and assign PICs to a request

**Purpose**
Confirm that acceptance creates assignments and starts the development phase.

**Preconditions**
- User has ITQM_DEVELOPMENT permission.
- A request is in "Pending IT Accept" status.

**Steps**
1. Navigate to **Development > Accept**.
2. Find a pending request.
3. Click **Accept**.
4. Select one or more PICs from the user list.
5. Set a due date.
6. Confirm acceptance.

**Expected Result**
- Request status changes to "In Progress".
- Assignments are created for each selected PIC.
- Each assignment shows the PIC name, due date, and status "In Progress".
- Request appears in the Done Report queue.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ACCEPT-003 — IT acceptor must select at least one PIC when accepting

**Purpose**
Confirm that acceptance requires PIC assignment.

**Preconditions**
- User has ITQM_DEVELOPMENT permission.
- A request is in "Pending IT Accept" status.

**Steps**
1. Navigate to **Development > Accept**.
2. Click Accept on a pending request.
3. Do not select any PIC.
4. Attempt to confirm acceptance.

**Expected Result**
- System requires at least one PIC to be selected.
- Acceptance is blocked until PICs are assigned.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-ACCEPT-004 — IT acceptor can reject a request with a note

**Purpose**
Confirm that IT acceptance rejection sends the request back to revision.

**Preconditions**
- User has ITQM_DEVELOPMENT REJECT permission.
- A request is in "Pending IT Accept" status.

**Steps**
1. Navigate to **Development > Accept**.
2. Find a pending request.
3. Click **Reject**.
4. Enter a rejection note.
5. Confirm the rejection.

**Expected Result**
- Request status changes to "Revision".
- Rejection note is recorded in the history timeline.
- Requester can see the rejection reason and resubmit.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ACCEPT-005 — IT acceptor cannot accept a request without selecting a due date

**Purpose**
Confirm that due date is mandatory for acceptance.

**Preconditions**
- User has ITQM_DEVELOPMENT permission.
- A request is in "Pending IT Accept" status.

**Steps**
1. Navigate to **Development > Accept**.
2. Click Accept on a pending request.
3. Select PICs but leave the due date empty.
4. Attempt to confirm acceptance.

**Expected Result**
- System requires a due date.
- Acceptance is blocked until a due date is set.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-ACCEPT-006 — Accepted request appears in the Done Report for tracking

**Purpose**
Confirm that acceptance flows correctly into the execution tracking phase.

**Preconditions**
- A request has been accepted with PICs assigned.

**Steps**
1. Accept a request as IT acceptor.
2. Navigate to **Development > Done Report**.
3. Observe the active tasks list.

**Expected Result**
- Accepted request appears in the Done Report.
- Each PIC's assignment shows status "In Progress".
- Request is visible for tracking until completion.

**Priority**
High

**Category**
Integration

---

#### QA-ITQM-ACCEPT-007 — User without acceptance permission cannot access the Accept page

**Purpose**
Confirm that non-acceptors cannot access the IT acceptance workflow.

**Preconditions**
- User does not have ITQM_DEVELOPMENT permission.

**Steps**
1. Sign in as a user without acceptance permission.
2. Attempt to open the Accept page from navigation.
3. Attempt to open the Accept URL directly.

**Expected Result**
- Accept is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
Critical

**Category**
Permission

---

## Done Report

#### QA-ITQM-DONE-001 — PIC can view their assigned tasks in Done Report

**Purpose**
Confirm that the Done Report shows tasks assigned to the current user.

**Preconditions**
- User has ITQM_DEVELOPMENT_DONE_REPORT permission.
- User has active assignments.

**Steps**
1. Sign in as a PIC.
2. Navigate to **Development > Done Report**.
3. Observe the task list.

**Expected Result**
- Assigned tasks are displayed.
- Each task shows subject, due date, and current status.
- PIC can mark their assignment as done.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DONE-002 — PIC can mark their assignment as done

**Purpose**
Confirm that a PIC can complete their assigned work.

**Preconditions**
- User has an active assignment in "In Progress" status.

**Steps**
1. Navigate to **Development > Done Report**.
2. Find an active assignment.
3. Click **Mark Done**.
4. Observe the result.

**Expected Result**
- Assignment status changes to "Done".
- picDoneAt timestamp is recorded.
- If all PICs are done, request status changes to "Pending Verification".

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DONE-003 — Request moves to pending verification when all PICs are done

**Purpose**
Confirm that the workflow advances automatically when all assignments are complete.

**Preconditions**
- All PICs on a request have marked their assignments as done.

**Steps**
1. Navigate to **Development > Done Report**.
2. Observe the request status.

**Expected Result**
- Request status changes to "Pending Verification".
- Verification action becomes available.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DONE-004 — Verifier can verify a completed request

**Purpose**
Confirm that verification finalizes the request as done.

**Preconditions**
- A request is in "Pending Verification" status.
- User has permission to verify.

**Steps**
1. Navigate to **Development > Done Report**.
2. Find a request in pending verification.
3. Click **Verify**.
4. Observe the result.

**Expected Result**
- Request status changes to "Done".
- Request is removed from the active tasks list.
- Completion is recorded in the history timeline.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-DONE-005 — Done Report auto-polls for real-time status updates

**Purpose**
Confirm that the Done Report refreshes automatically to reflect status changes.

**Preconditions**
- User is on the Done Report page.
- Another user marks an assignment as done.

**Steps**
1. Stay on the Done Report page.
2. Have another user mark their assignment as done.
3. Observe the page after ~60 seconds.

**Expected Result**
- Page automatically refreshes.
- Status changes are reflected without manual refresh.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-DONE-006 — User can toggle registration on an assignment

**Purpose**
Confirm that the register toggle is available on assignments.

**Preconditions**
- User has an active assignment.

**Steps**
1. Navigate to **Development > Done Report**.
2. Find an active assignment.
3. Toggle the Register switch.
4. Observe the result.

**Expected Result**
- Registration status toggles successfully.
- Change is recorded in the system.

**Priority**
Low

**Category**
Happy Path

---

#### QA-ITQM-DONE-007 — Admin can override done status to re-open a completed request

**Purpose**
Confirm that completed requests can be reopened by authorized users.

**Preconditions**
- A request is in "Done" status.
- User has admin or verifier override permission.

**Steps**
1. Navigate to **Development > Done Report**.
2. Find a completed request.
3. Click **Override Done**.
4. Confirm the action.

**Expected Result**
- Request status changes back to "In Progress".
- Assignments are reset to "In Progress".
- Request reappears in the active tasks list.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-DONE-008 — User cannot mark an assignment as done if it is not assigned to them

**Purpose**
Confirm that PICs can only complete their own assignments.

**Preconditions**
- User has assignments on multiple requests.
- Another user has their own assignments.

**Steps**
1. Navigate to **Development > Done Report**.
2. Attempt to mark done on an assignment that belongs to another PIC.

**Expected Result**
- System prevents marking another user's assignment as done.
- Only the assigned PIC can complete their own work.

**Priority**
High

**Category**
Permission

---

## Issue Tracker

#### QA-ITQM-ISSUE-001 — User can create an engineering issue

**Purpose**
Confirm that users can create issues in the tracker.

**Preconditions**
- User has ITQM_ISSUE CREATE permission.
- User is signed in with ITQM access.

**Steps**
1. Navigate to **Development > Issue List**.
2. Click **Create New Issue**.
3. Fill in: title, description, type, priority, due date, assignee.
4. Save the issue.

**Expected Result**
- Issue is created successfully.
- Issue appears in the list with a generated key (e.g., ITQM-XXX).
- User can view the issue detail.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-002 — User cannot create an issue with required fields missing

**Purpose**
Confirm that validation blocks incomplete issue creation.

**Preconditions**
- User has ITQM_ISSUE CREATE permission.

**Steps**
1. Navigate to **Development > Issue List**.
2. Click **Create New Issue**.
3. Leave required fields empty.
4. Attempt to save.

**Expected Result**
- Form validation catches missing required fields.
- Save is blocked until all required fields are filled.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-ISSUE-003 — User can edit an existing issue

**Purpose**
Confirm that issues can be modified after creation.

**Preconditions**
- User has ITQM_ISSUE UPDATE permission.
- An issue exists in the system.

**Steps**
1. Navigate to **Development > Issue List**.
2. Open an issue detail.
3. Click Edit.
4. Modify fields.
5. Save changes.

**Expected Result**
- Issue is updated successfully.
- Changes are reflected in the list and detail view.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-004 — User can filter issues by status

**Purpose**
Confirm that status filtering works on the issue list.

**Preconditions**
- Issues with different statuses exist.

**Steps**
1. Navigate to **Development > Issue List**.
2. Select a status filter.
3. Observe the filtered results.

**Expected Result**
- Only issues matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-005 — User can filter issues by priority

**Purpose**
Confirm that priority filtering works on the issue list.

**Preconditions**
- Issues with different priorities exist.

**Steps**
1. Navigate to **Development > Issue List**.
2. Select a priority filter.
3. Observe the filtered results.

**Expected Result**
- Only issues matching the selected priority are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-006 — User can view issues on the Kanban board

**Purpose**
Confirm that the Kanban board displays issues in columns by status.

**Preconditions**
- User has ITQM_ISSUE READ permission.
- Issues exist in various statuses.

**Steps**
1. Navigate to **Development > Kanban Board**.
2. Observe the board layout.

**Expected Result**
- Issues are displayed in columns: Backlog, Ready, In Progress, In Review, Done.
- Each card shows issue title, priority, and assignee.
- Cards are sorted by priority then last updated.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-007 — User can drag and drop issues to change status on the Kanban board

**Purpose**
Confirm that drag-and-drop status transitions work correctly.

**Preconditions**
- User has ITQM_ISSUE UPDATE permission.
- Issues exist on the Kanban board.

**Steps**
1. Navigate to **Development > Kanban Board**.
2. Drag an issue card from one column to another.
3. Observe the result.

**Expected Result**
- Issue status updates to match the target column.
- Invalid drops are rejected (transition not allowed).
- Status change is persisted.

**Priority**
High

**Category**
Happy Path

---

#### QA-ITQM-ISSUE-008 — Kanban board enforces valid status transitions

**Purpose**
Confirm that only valid status transitions are allowed via drag-and-drop.

**Preconditions**
- User is on the Kanban board.
- An issue is in "Backlog" status.

**Steps**
1. Attempt to drag the Backlog issue to "In Review" (skipping "Ready" and "In Progress").
2. Attempt to drag it to "Ready" (valid transition).
3. Observe both results.

**Expected Result**
- Drag to "Ready" succeeds.
- Drag to "In Review" is rejected; card snaps back to original column.

**Priority**
High

**Category**
Validation

---

#### QA-ITQM-ISSUE-009 — User can link an issue to a development request

**Purpose**
Confirm that issues can be associated with development requests.

**Preconditions**
- User has ITQM_ISSUE CREATE permission.
- A development request exists.

**Steps**
1. Navigate to **Development > Issue List**.
2. Create a new issue.
3. Select an existing development request as the linked request.
4. Save the issue.

**Expected Result**
- Issue is created with the linked request.
- Link is visible in the issue detail.

**Priority**
Medium

**Category**
Happy Path

---

## Configuration

#### QA-ITQM-CONFIG-001 — Administrator can create a request type

**Purpose**
Confirm that admin can add new request types for the dropdown.

**Preconditions**
- User has ITQM_DEVELOPMENT_CONFIG permission.
- User is on the Config page.

**Steps**
1. Navigate to **Development > Config**.
2. In the Request Type section, click **Create**.
3. Enter a label and sort order.
4. Save the type.

**Expected Result**
- New request type appears in the list.
- Type is available in the request creation form.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-CONFIG-002 — Administrator can create a system type

**Purpose**
Confirm that admin can add new system types for the dropdown.

**Preconditions**
- User has ITQM_DEVELOPMENT_CONFIG permission.
- User is on the Config page.

**Steps**
1. Navigate to **Development > Config**.
2. In the System Type section, click **Create**.
3. Enter a label and sort order.
4. Save the type.

**Expected Result**
- New system type appears in the list.
- Type is available in the request creation form.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-CONFIG-003 — Administrator can toggle a config item active/inactive

**Purpose**
Confirm that config items can be deactivated.

**Preconditions**
- User has ITQM_DEVELOPMENT_CONFIG permission.
- Config items exist.

**Steps**
1. Navigate to **Development > Config**.
2. Find an active config item.
3. Toggle it to inactive.
4. Observe the result.

**Expected Result**
- Item is marked as inactive.
- Inactive items are not available in request creation dropdowns.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-CONFIG-004 — Administrator can edit an existing config item

**Purpose**
Confirm that config items can be updated.

**Preconditions**
- User has ITQM_DEVELOPMENT_CONFIG permission.
- Config items exist.

**Steps**
1. Navigate to **Development > Config**.
2. Edit a config item's label or sort order.
3. Save changes.

**Expected Result**
- Config item is updated.
- Changes are reflected in request creation forms.

**Priority**
Low

**Category**
Happy Path

---

## Development Report

#### QA-ITQM-REPORT-001 — User can view all development requests in the report

**Purpose**
Confirm that the Development Report shows a read-only view of all requests.

**Preconditions**
- User has ITQM_DEVELOP_LIST READ permission.
- Requests exist in the system.

**Steps**
1. Navigate to **Development List > Development Report**.
2. Observe the report list.

**Expected Result**
- All development requests are displayed.
- Report is read-only (no edit or action buttons).
- Columns show status, type, system, requester, and dates.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-REPORT-002 — User can filter the development report

**Purpose**
Confirm that report filtering works by status, type, system, and date range.

**Preconditions**
- Multiple requests with varying attributes exist.

**Steps**
1. Navigate to **Development List > Development Report**.
2. Apply filters (status, type, system, date range).
3. Observe the filtered results.

**Expected Result**
- Report updates to show only matching requests.
- Filters can be combined.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-REPORT-003 — User can search the development report

**Purpose**
Confirm that text search works on the report.

**Preconditions**
- Multiple requests exist.

**Steps**
1. Navigate to **Development List > Development Report**.
2. Enter a search term.
3. Observe the filtered results.

**Expected Result**
- Search matches against subject and requirement fields.
- Results update in real time.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-ITQM-REPORT-004 — User can view request detail from the report

**Purpose**
Confirm that clicking a report row opens the detail modal.

**Preconditions**
- A request exists in the report.

**Steps**
1. Navigate to **Development List > Development Report**.
2. Click on a request row.
3. Observe the detail modal.

**Expected Result**
- Detail modal opens showing full request information.
- History timeline and assignments are visible.

**Priority**
Low

**Category**
Happy Path

---

## Permissions

#### QA-ITQM-PERM-001 — User without development permission cannot see Development menu

**Purpose**
Confirm that the Development menu is hidden without proper permissions.

**Preconditions**
- User does not have ITQM_DEVELOPMENT_PROCESS_REQUEST or ITQM_DEVELOPMENT permission.

**Steps**
1. Sign in as a user without development permission.
2. Observe the sidebar navigation.

**Expected Result**
- Development menu group is not visible.
- User cannot access any development-related pages.

**Priority**
Critical

**Category**
Permission

---

#### QA-ITQM-PERM-002 — User without issue permission cannot access Issue List or Kanban Board

**Purpose**
Confirm that issue permissions gate both list and board views.

**Preconditions**
- User does not have ITQM_ISSUE permission.

**Steps**
1. Sign in as a user without issue permission.
2. Attempt to open Issue List or Kanban Board.
3. Attempt to open the URLs directly.

**Expected Result**
- Issue List and Kanban Board are not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
Critical

**Category**
Permission

---

#### QA-ITQM-PERM-003 — Normal user cannot access the Config page

**Purpose**
Confirm that config management is restricted to authorized users.

**Preconditions**
- User does not have ITQM_DEVELOPMENT_CONFIG permission.

**Steps**
1. Sign in as a normal user.
2. Attempt to open the Config page from navigation.
3. Attempt to open the Config URL directly.

**Expected Result**
- Config is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
Critical

**Category**
Permission

---

#### QA-ITQM-PERM-004 — User can only see requests they have permission to view

**Purpose**
Confirm that module-level READ permission controls request visibility.

**Preconditions**
- User has limited ITQM permissions.

**Steps**
1. Sign in as a user with partial ITQM permissions.
2. Navigate to Development pages.
3. Observe which requests are visible.

**Expected Result**
- Only requests within the user's permitted modules are visible.
- Requests outside permitted modules are hidden.

**Priority**
High

**Category**
Permission

---

#### QA-ITQM-PERM-005 — SysAdmin can access all ITQM features regardless of module permissions

**Purpose**
Confirm that sysadmin bypasses all permission checks.

**Preconditions**
- User has sysadmin status (isSysAdmin = true).

**Steps**
1. Sign in as a sysadmin.
2. Navigate to all ITQM pages.
3. Perform actions on each page.

**Expected Result**
- All ITQM features are accessible.
- All CRUD and workflow actions are available.

**Priority**
High

**Category**
Permission

---

## Coverage Quality Check

- [x] Every major user-facing module covered
- [x] Critical business flows covered (request lifecycle, issue tracking, kanban)
- [x] Important validations covered (required fields, status transitions, permission gates)
- [x] Permission-sensitive actions covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Coverage Gaps

- Attachment upload in the request form is not wired to a backend service (logs to console only); upload scenarios cannot be fully tested.
- Issues Phase 1: Backend endpoints are noted as pending; mock data is used when API is unavailable. Issue CRUD testing may depend on mock behavior.
- Override Done action may require specific admin role; exact permission gating may vary.
- Dashboard module count behavior (hiding nav bar when only 1 module) is a UI detail with limited QA impact.

---

Implementation Reference:
`src/routes/_protected/develop-*` — Development routes
`src/components/features/development/` — Development components
`src/components/features/development/kanban/` — Kanban board
`src/services/` — API service layer
`src/stores/development-store.ts` — Development Zustand store
