# Daily Operation Manual QA Scenario Catalog

## Scope

Daily Operation is an operational workspace application for managing daily checklists, approvals, and configurations. This catalog covers the actual implementation in `cssi-daily-operation`, including the Today workspace, approval workflow, history view, and IT Config management. Note: Settlement and Risk Management divisions exist in code but are hidden from sidebar and render empty/error states (division IDs not yet configured).

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Today Workspace | View checklist, Complete items, Save, Submit | 10 |
| Approvals | View pending, Approve, Reject | 8 |
| History | View past reports, Filter, Detail | 5 |
| IT Config | Manage Tasks, Parts, Items | 8 |
| Permissions | Module access, Action gating | 5 |
| **Total** | | **36** |

---

## Today Workspace

#### QA-DAILY-TODAY-001 — User sees today's assigned checklist

**Purpose**
Confirm that the Today page displays the user's daily checklist items organized by task and part.

**Preconditions**
- User has the Today operation permission.
- Tasks, parts, and items have been configured.

**Steps**
1. Sign in and navigate to **Operations > Today**.
2. Observe the page content.

**Expected Result**
- Today's checklist is displayed.
- Items are organized by task and part sections.
- Progress bar shows completed vs. total items.
- State badge indicates current submission status.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-002 — User sees "You're clear for today" when no checks are assigned

**Purpose**
Confirm that the empty state is shown when there is no work for today.

**Preconditions**
- No tasks, parts, or items have been configured, or today's date has no assignments.

**Steps**
1. Sign in and navigate to **Operations > Today**.
2. Observe the page content.

**Expected Result**
- Empty state message is displayed: "You're clear for today".
- No error or loading state persists.

**Priority**
Medium

**Category**
Edge Case

---

#### QA-DAILY-TODAY-003 — User can check an item as complete

**Purpose**
Confirm that checklist items can be marked as completed.

**Preconditions**
- User is on the Today page with items to check.

**Steps**
1. Locate a checklist item.
2. Click the checkbox to mark it complete.
3. Observe the change.

**Expected Result**
- Item is marked as complete.
- Progress bar updates to reflect the new completion count.
- Item may show a comment/action field for additional notes.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-004 — User can add a comment or action text to a checklist item

**Purpose**
Confirm that users can add notes to completed items.

**Preconditions**
- User is on the Today page with items to check.

**Steps**
1. Check an item as complete.
2. Enter text in the comment field.
3. Enter text in the action field.
4. Save the part.

**Expected Result**
- Comment and action text are saved with the item.
- Text is displayed when viewing the submission detail.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-DAILY-TODAY-005 — User can save unfinished work as a draft

**Purpose**
Confirm that partial work can be saved before final submission.

**Preconditions**
- User is on the Today page with items to check.

**Steps**
1. Check some but not all items.
2. Click **Save Part**.
3. Observe the result.

**Expected Result**
- Partially completed work is saved.
- Toast confirmation is shown.
- Saved work can be resumed later.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-006 — User can submit completed work for approval

**Purpose**
Confirm that the user can submit all parts for approval.

**Preconditions**
- User has saved all parts on the Today page.

**Steps**
1. Complete all checklist items.
2. Click **Submit for approval** in the footer.
3. Observe the result.

**Expected Result**
- All parts are submitted for approval.
- Status changes to "Pending Approval".
- User is notified of the submission.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-007 — User cannot submit when required items are incomplete

**Purpose**
Confirm that submission is blocked if required items are not checked.

**Preconditions**
- User is on the Today page.
- Some required items remain unchecked.

**Steps**
1. Leave some items unchecked.
2. Attempt to submit for approval.

**Expected Result**
- System prevents submission.
- User is notified which items are incomplete.

**Priority**
High

**Category**
Validation

---

#### QA-DAILY-TODAY-008 — User sees rejected work with a "Needs Attention" section

**Purpose**
Confirm that rejected submissions are clearly indicated.

**Preconditions**
- A submission has been rejected by an approver.

**Steps**
1. Sign in and navigate to **Operations > Today**.
2. Observe the page for rejected items.

**Expected Result**
- Rejected parts are highlighted with a red badge.
- "Needs Attention" section lists rejected parts.
- Rejection reason is displayed for each rejected part.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-009 — User can fix and resubmit a rejected part

**Purpose**
Confirm that rejected work can be corrected and resubmitted.

**Preconditions**
- A submission has been rejected.

**Steps**
1. Navigate to the rejected part.
2. Click the **Fix** button.
3. Modify the checklist items.
4. Save the part.
5. Submit for approval again.

**Expected Result**
- User can edit the rejected part.
- Corrections are saved.
- Resubmission succeeds and status changes to "Pending Approval".

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-TODAY-010 — Refreshing the page loses unsaved local draft changes

**Purpose**
Confirm the known limitation that local drafts are not persisted across page refreshes.

**Preconditions**
- User is on the Today page with unsaved changes.

**Steps**
1. Check some items on the Today page.
2. Do not save the part.
3. Refresh the browser page.
4. Observe the page state.

**Expected Result**
- Unsaved changes are lost.
- Page reloads with the last saved server state.
- No data recovery is available for unsaved changes.

**Priority**
High

**Category**
Edge Case

---

## Approvals

#### QA-DAILY-APPROVAL-001 — Approver can view pending submissions

**Purpose**
Confirm that the Approvals page shows submissions waiting for review.

**Preconditions**
- User has the Approvals permission.
- Pending submissions exist.

**Steps**
1. Sign in as an approver.
2. Navigate to **Operations > Approvals**.
3. Observe the list.

**Expected Result**
- Pending submissions are displayed.
- Each entry shows task name, part name, submitter, and time.
- Badge shows the count of waiting submissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-APPROVAL-002 — Approver can approve a pending submission

**Purpose**
Confirm that an approver can approve a submitted checklist.

**Preconditions**
- User has the Approvals permission.
- A pending submission exists.

**Steps**
1. Navigate to **Operations > Approvals**.
2. Find a pending submission.
3. Click the **Approve** button.
4. Observe the result.

**Expected Result**
- Submission is approved.
- Status changes to "Approved".
- Approver name and approval time are recorded.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-APPROVAL-003 — Approver can reject a submission with a reason

**Purpose**
Confirm that an approver can reject a submission and must provide a reason.

**Preconditions**
- User has the Approvals permission.
- A pending submission exists.

**Steps**
1. Navigate to **Operations > Approvals**.
2. Find a pending submission.
3. Click the **Reject** button.
4. Enter a rejection reason.
5. Confirm the rejection.

**Expected Result**
- Submission is rejected.
- Status changes to "Rejected".
- Rejection reason is recorded and visible to the operator.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-APPROVAL-004 — Approver cannot reject without providing a reason

**Purpose**
Confirm that rejection requires a mandatory reason field.

**Preconditions**
- User has the Approvals permission.
- A pending submission exists.

**Steps**
1. Navigate to **Operations > Approvals**.
2. Click Reject on a pending submission.
3. Leave the reason field empty.
4. Attempt to confirm rejection.

**Expected Result**
- System requires a rejection reason.
- Rejection is blocked until a reason is provided.

**Priority**
High

**Category**
Validation

---

#### QA-DAILY-APPROVAL-005 — Approved submissions cannot be edited by the operator

**Purpose**
Confirm that approved data is locked from further modification.

**Preconditions**
- A submission has been approved.

**Steps**
1. Navigate to **Operations > Today**.
2. Find the approved part.
3. Attempt to modify checklist items.

**Expected Result**
- Approved part is locked (showing a lock icon).
- Items cannot be edited.
- Submit button is not available for approved parts.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-APPROVAL-006 — User without APPROVE permission cannot see the Approvals page

**Purpose**
Confirm that non-approvers cannot access the approvals workflow.

**Preconditions**
- User does not have the Approvals permission.

**Steps**
1. Sign in as a user without approval permission.
2. Attempt to open the Approvals page from navigation.
3. Attempt to open the Approvals URL directly.

**Expected Result**
- Approvals is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
High
**Category**
Permission

**Category**
Permission

---

#### QA-DAILY-APPROVAL-007 — Approver cannot see submissions from other divisions

**Purpose**
Confirm that division-based data isolation works correctly.

**Preconditions**
- Submissions exist from multiple divisions (IT, Settlement, Risk).
- User has approval permission for only one division.

**Steps**
1. Sign in as an approver with IT division permission only.
2. Navigate to **Operations > Approvals**.
3. Observe the submitted items.

**Expected Result**
- Only IT division submissions are visible.
- Settlement and Risk submissions are not shown.

**Priority**
Medium

**Category**
Permission

---

#### QA-DAILY-APPROVAL-008 — Double approval is prevented

**Purpose**
Confirm that a submission cannot be approved twice.

**Preconditions**
- A pending submission exists.

**Steps**
1. Approve a submission.
2. Attempt to approve the same submission again.

**Expected Result**
- Second approval attempt is blocked.
- System indicates the submission is already approved.

**Priority**
High

**Category**
Edge Case

---

## History

#### QA-DAILY-HIST-001 — User can view past submissions in History

**Purpose**
Confirm that the History page shows previously submitted reports.

**Preconditions**
- User has the History report permission.
- Past submissions exist.

**Steps**
1. Sign in and navigate to **Operations > History**.
2. Observe the list.

**Expected Result**
- Historical submissions are displayed in a paginated table.
- Columns show date, task, part, submitter, submit time, approver, approve time, and status.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-HIST-002 — User can filter history by date

**Purpose**
Confirm that date filtering narrows the results correctly.

**Preconditions**
- Submissions span multiple dates.

**Steps**
1. Navigate to **Operations > History**.
2. Select a date range.
3. Apply the filter.

**Expected Result**
- Only submissions within the selected date range are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-DAILY-HIST-003 — User can search history by task or part name

**Purpose**
Confirm that text search works on historical reports.

**Preconditions**
- Multiple submissions exist with different task/part names.

**Steps**
1. Navigate to **Operations > History**.
2. Enter a search term in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results match the entered term against task and part names.
- Search updates in real time.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-DAILY-HIST-004 — User can view details of a past submission

**Purpose**
Confirm that clicking a history row opens the submission detail.

**Preconditions**
- A past submission exists.

**Steps**
1. Navigate to **Operations > History**.
2. Click on a submission row.
3. Observe the detail dialog.

**Expected Result**
- Detail dialog opens showing checklist items.
- Item completion status, comments, and action text are visible.
- Approval information is displayed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-DAILY-HIST-005 — History shows both approved and rejected submissions

**Purpose**
Confirm that history includes all submission outcomes.

**Preconditions**
- Approved and rejected submissions exist.

**Steps**
1. Navigate to **Operations > History**.
2. Observe the status column.

**Expected Result**
- Both approved and rejected submissions are listed.
- Status badges clearly differentiate outcomes.

**Priority**
Medium

**Category**
Happy Path

---

## IT Config

#### QA-DAILY-CONFIG-001 — Administrator can create a new task

**Purpose**
Confirm that admin can define a new operational task.

**Preconditions**
- User has the Config creation permission.
- User is on the Config page.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Click **Create Task**.
3. Enter a task name.
4. Save the task.

**Expected Result**
- New task is created and appears in the list.
- Task can have parts added to it.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-CONFIG-002 — Administrator can create a part under a task

**Purpose**
Confirm that admin can add parts to an existing task.

**Preconditions**
- User has the Config creation permission.
- At least one task exists.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Select a task.
3. Click **Create Part**.
4. Enter a part name.
5. Save the part.

**Expected Result**
- New part is created under the selected task.
- Part appears in the task's part list.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-CONFIG-003 — Administrator can create an item under a part

**Purpose**
Confirm that admin can add checklist items to a part.

**Preconditions**
- User has the Config creation permission.
- At least one part exists.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Select a part.
3. Click **Create Item**.
4. Enter an item label.
5. Save the item.

**Expected Result**
- New item is created under the selected part.
- Item appears in the part's item list.
- Item will appear in the Today checklist for operators.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-CONFIG-004 — Administrator can edit a task, part, or item

**Purpose**
Confirm that existing config items can be modified.

**Preconditions**
- User has the Config editing permission.
- Tasks, parts, and items exist.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Edit a task name, part name, or item label.
3. Save the changes.

**Expected Result**
- Changes are saved successfully.
- Updated names are reflected in the Today workspace.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-DAILY-CONFIG-005 — Administrator can delete a task, part, or item

**Purpose**
Confirm that config items can be removed with confirmation.

**Preconditions**
- User has the Config deletion permission.
- Config items exist.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Delete a task (or part or item).
3. Confirm the deletion.

**Expected Result**
- Confirmation dialog appears before deletion.
- Item is removed from the config tree.
- Child items are also removed if a task or part is deleted.

**Priority**
High

**Category**
Happy Path

---

#### QA-DAILY-CONFIG-006 — Normal user cannot access the Config page

**Purpose**
Confirm that non-admin users cannot modify the config.

**Preconditions**
- User does not have IT_CONFIG permission.

**Steps**
1. Sign in as a normal user.
2. Attempt to open the Config page from navigation.
3. Attempt to open the Config URL directly.

**Expected Result**
- Config is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-DAILY-CONFIG-007 — Config changes take effect immediately in the Today workspace

**Purpose**
Confirm that adding/modifying config items affects the operator's daily view.

**Preconditions**
- Admin has created or modified tasks, parts, or items.

**Steps**
1. As admin, create a new item under an existing part.
2. Sign in as an operator.
3. Navigate to **Operations > Today**.
4. Observe the checklist.

**Expected Result**
- New item appears in the operator's checklist.
- Changes are reflected without delay.

**Priority**
High

**Category**
Integration

---

#### QA-DAILY-CONFIG-008 — Administrator can reorder parts and items by sort order

**Purpose**
Confirm that sort order affects the display sequence.

**Preconditions**
- Multiple parts and items exist.

**Steps**
1. Navigate to **Operations > IT Config**.
2. Adjust the sort order of parts or items.
3. Save changes.
4. Navigate to **Operations > Today**.
5. Observe the display order.

**Expected Result**
- Parts and items appear in the configured sort order.
- Order is maintained across the application.

**Priority**
Low

**Category**
Happy Path

---

## Permissions

#### QA-DAILY-PERM-001 — User without TODAY permission cannot access the Today page

**Purpose**
Confirm that users without IT_CHECK_DAILY permission are blocked.

**Preconditions**
- User does not have the Today operation permission.

**Steps**
1. Sign in as a user without TODAY permission.
2. Attempt to open the Today page from navigation.
3. Attempt to open the Today URL directly.

**Expected Result**
- Today is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-DAILY-PERM-002 — User without APPROVE permission cannot approve submissions

**Purpose**
Confirm that the approve action respects approval permission.

**Preconditions**
- User has TODAY READ but not APPROVE permission.

**Steps**
1. Navigate to the Approvals page.
2. Look for approve buttons on pending submissions.

**Expected Result**
- Approve buttons are not visible.
- User cannot approve any submission.

**Priority**
High

**Category**
Permission

---

#### QA-DAILY-PERM-003 — User without REPORT permission cannot view History

**Purpose**
Confirm that the History page respects report permission.

**Preconditions**
- User does not have the History report permission.

**Steps**
1. Sign in as a user without history permission.
2. Attempt to open the History page.
3. Attempt to open the History URL directly.

**Expected Result**
- History is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-DAILY-PERM-004 — Settlement and Risk divisions are hidden from the sidebar

**Purpose**
Confirm that unconfigured divisions do not appear in navigation.

**Preconditions**
- User is signed in with appropriate permissions.

**Steps**
1. Sign in and observe the sidebar navigation.
2. Look for Settlement and Risk Management groups.

**Expected Result**
- Settlement and Risk Management groups are not visible.
- These divisions are disabled until division IDs are configured.

**Priority**
Medium

**Category**
Edge Case

---

#### QA-DAILY-PERM-005 — Admin user can access all operations features

**Purpose**
Confirm that admin users bypass operation-level permission restrictions.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to all Operations pages (Today, Approvals, History, Config).
3. Perform actions on each page.

**Expected Result**
- All operations features are accessible.
- All CRUD and approval actions are available.

**Priority**
High

**Category**
Permission

---

## Coverage Quality Check

- [x] Every major user-facing module covered
- [x] Critical business flows covered (Today workflow, approval, history)
- [x] Important validations covered (required items, rejection reason, confirmation dialogs)
- [x] Permission-sensitive actions covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Coverage Gaps

- Settlement and Risk Management divisions are hidden and not fully implemented; scenarios cannot be tested until division IDs are configured.
- Draft persistence across page refresh is a known limitation (local-only storage); scenarios reflect this behavior.
- N+1 query performance is a backend concern not visible to manual QA.
- Race conditions on concurrent submissions are difficult to test manually.

---

Implementation Reference:
`src/routes/_protected/operations/` — Operation routes
`src/components/features/daily-operations/today/` — Today workspace
`src/components/features/approvals/` — Approval workflows
`src/components/features/daily-operations/config-task-tree.tsx` — Config management
`src/services/daily-operations/` — API service layer
