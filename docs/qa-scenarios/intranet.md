# Intranet Manual QA Scenario Catalog

## Scope

Intranet is an internal corporate communications and compliance platform within the CSSI ecosystem. It manages announcements, regulations (Compliance, HRD, Legal), and internal communications. This catalog covers the actual implementation in `cssi-intranet`, including the dashboard, announcement CRUD, regulation management with role-based visibility, notifications, and admin panel.

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Dashboard | Widgets, Announcements, Regulations Overview | 5 |
| System Announcements | Create, Edit, Delete, List, Filter | 7 |
| Intranet Announcements | Create, Edit, Delete, List, Division filter | 6 |
| Regulations | Compliance/HRD/Legal CRUD, Role visibility, Detail | 10 |
| Notifications | View, Filter, Mark Read, Delete | 5 |
| Admin Panel | Users, Roles, Audit Logs, Announcements | 8 |
| Account Settings | Profile, Security, Sessions, Preferences | 5 |
| Permissions | Module access, Role-based regulation visibility | 4 |
| **Total** | | **50** |

---

## Dashboard

#### QA-INTRANET-DASH-001 — User can view the dashboard with widget summaries

**Purpose**
Confirm that the dashboard loads and displays relevant widgets.

**Preconditions**
- User is signed in with Intranet access.
- System has some data (announcements, regulations).

**Steps**
1. Sign in and navigate to Intranet.
2. Observe the dashboard home page.

**Expected Result**
- Dashboard loads successfully.
- Widgets display: system announcements, intranet announcements, regulations overview.
- "Last updated" timestamp is visible.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-DASH-002 — User can see new announcements highlighted

**Purpose**
Confirm that recent announcements are marked as "New".

**Preconditions**
- Active announcements exist, some created within the last 7 days.

**Steps**
1. Sign in and navigate to the Intranet dashboard.
2. Locate the announcements widget.
3. Observe announcements created recently.

**Expected Result**
- Announcements created within the last 7 days show a "New" badge.
- Older announcements do not show the "New" badge.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-DASH-003 — User can click an announcement to view details

**Purpose**
Confirm that clicking an announcement navigates to its detail page.

**Preconditions**
- At least one active announcement exists.

**Steps**
1. Sign in and navigate to the Intranet dashboard.
2. Click on an announcement in the widget.
3. Observe the navigation.

**Expected Result**
- User is navigated to the announcement detail page.
- Full announcement content is displayed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-DASH-004 — User can manually refresh dashboard data

**Purpose**
Confirm that the refresh button reloads all dashboard widgets.

**Preconditions**
- User is on the Intranet dashboard.

**Steps**
1. Navigate to the Intranet dashboard.
2. Click the Refresh button.
3. Observe the widgets.

**Expected Result**
- All widgets reload their data.
- "Last updated" timestamp changes to the current time.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-DASH-005 — Dashboard shows error state with retry when data fails to load

**Purpose**
Confirm that the dashboard handles API failures gracefully.

**Preconditions**
- User is signed in with Intranet access.

**Steps**
1. Sign in and navigate to the Intranet dashboard.
2. Simulate or wait for an API failure.
3. Observe the dashboard state.

**Expected Result**
- Error state is displayed instead of a blank screen.
- A retry button is available.
- Clicking retry attempts to reload the data.

**Priority**
Medium

**Category**
Negative

---

## System Announcements

#### QA-INTRANET-SYSANN-001 — Administrator can create a system announcement

**Purpose**
Confirm that an admin can publish a system-wide announcement.

**Preconditions**
- User has admin permissions.
- User is on the admin announcements page.

**Steps**
1. Navigate to **Admin > System Announcements**.
2. Click **Create Announcement**.
3. Enter a title, content, and priority (HIGH, MEDIUM, LOW).
4. Set start and end dates if applicable.
5. Save the announcement.

**Expected Result**
- Announcement is created and appears in the list.
- Announcement appears on user dashboards when active.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-SYSANN-002 — Administrator can edit an existing system announcement

**Purpose**
Confirm that an admin can update an existing announcement.

**Preconditions**
- User has admin permissions.
- At least one system announcement exists.

**Steps**
1. Navigate to **Admin > System Announcements**.
2. Find an existing announcement.
3. Edit the title or content.
4. Save changes.

**Expected Result**
- Announcement is updated.
- Updated content is reflected for users.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-SYSANN-003 — Administrator can delete a system announcement

**Purpose**
Confirm that an admin can remove a system announcement.

**Preconditions**
- User has admin permissions.
- At least one system announcement exists.

**Steps**
1. Navigate to **Admin > System Announcements**.
2. Find an existing announcement.
3. Delete the announcement.
4. Confirm the deletion.

**Expected Result**
- Announcement is removed from the list.
- Announcement no longer appears on user dashboards.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-SYSANN-004 — Administrator can activate and deactivate announcements

**Purpose**
Confirm that announcement active/inactive toggle works.

**Preconditions**
- User has admin permissions.
- At least one system announcement exists.

**Steps**
1. Navigate to **Admin > System Announcements**.
2. Find an active announcement.
3. Deactivate it.
4. Reactivate it.
5. Observe the list and dashboard.

**Expected Result**
- Deactivated announcements are not shown on dashboards.
- Reactivated announcements reappear on dashboards.
- List shows the correct active/inactive status.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-SYSANN-005 — System announcements respect priority ordering

**Purpose**
Confirm that high-priority announcements are displayed prominently.

**Preconditions**
- Multiple system announcements with different priorities exist.

**Steps**
1. Navigate to the Intranet dashboard.
2. Observe the announcements widget.

**Expected Result**
- HIGH priority announcements are displayed first or highlighted.
- Priority badges (HIGH, MEDIUM, LOW) are visible.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-SYSANN-006 — Normal user cannot create, edit, or delete system announcements

**Purpose**
Confirm that non-admin users cannot manage system announcements.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to navigate to the System Announcements management page.
3. Attempt to open the management URL directly.

**Expected Result**
- System Announcements management is not accessible.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-INTRANET-SYSANN-007 — Search filters system announcements correctly

**Purpose**
Confirm that search and filter functionality works on the announcements list.

**Preconditions**
- Multiple system announcements exist with different statuses and priorities.

**Steps**
1. Navigate to **Admin > System Announcements**.
2. Enter a search term.
3. Apply status and priority filters.
4. Observe the filtered results.

**Expected Result**
- Results match the search term and all applied filters.
- Filters can be combined and cleared independently.

**Priority**
Medium

**Category**
Happy Path

---

## Intranet Announcements

#### QA-INTRANET-INTRANETANN-001 — User with permission can create an intranet announcement

**Purpose**
Confirm that authorized users can create division-specific announcements.

**Preconditions**
- User has the intranet announcements permission.
- User is on the intranet announcements management page.

**Steps**
1. Navigate to **Intranet > Announcements > Manage**.
2. Click **Create Announcement**.
3. Enter title, content, and priority.
4. Save the announcement.

**Expected Result**
- Announcement is created and appears in the list.
- Announcement appears in the intranet announcements widget.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-INTRANETANN-002 — User can view intranet announcements in the dashboard widget

**Purpose**
Confirm that intranet announcements are visible on the dashboard.

**Preconditions**
- Active intranet announcements exist.
- User is signed in with Intranet access.

**Steps**
1. Sign in and navigate to the Intranet dashboard.
2. Locate the Intranet Announcements widget.
3. Observe the displayed announcements.

**Expected Result**
- Active intranet announcements are displayed in the widget.
- Clicking an announcement navigates to its detail page.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-INTRANETANN-003 — User can filter intranet announcements by division

**Purpose**
Confirm that division filtering works on intranet announcements.

**Preconditions**
- Intranet announcements from multiple divisions exist.

**Steps**
1. Navigate to the Intranet announcements page.
2. Select a division filter.
3. Observe the filtered results.

**Expected Result**
- Only announcements from the selected division are shown.
- Filter updates the list dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-INTRANETANN-004 — User can view intranet announcement detail

**Purpose**
Confirm that clicking an announcement opens its full detail view.

**Preconditions**
- At least one intranet announcement exists.

**Steps**
1. Navigate to the Intranet announcements page.
2. Click on an announcement row.
3. Observe the detail view.

**Expected Result**
- Announcement detail page opens.
- Full content, priority, and metadata are displayed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-INTRANETANN-005 — Administrator can see "Manage announcements" button on dashboard

**Purpose**
Confirm that the manage button is only visible to authorized users.

**Preconditions**
- User has the intranet announcements permission.

**Steps**
1. Navigate to the Intranet dashboard.
2. Observe the Intranet Announcements widget.

**Expected Result**
- "Manage announcements" button is visible for authorized users.
- Button navigates to the announcements management page when clicked.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-INTRANETANN-006 — Normal user cannot manage intranet announcements

**Purpose**
Confirm that non-authorized users cannot access the management interface.

**Preconditions**
- User does not have the intranet announcements permission.

**Steps**
1. Sign in as a user without intranet announcement permission.
2. Attempt to navigate to the announcements management page.
3. Attempt to open the management URL directly.

**Expected Result**
- Management interface is not accessible.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

## Regulations

#### QA-INTRANET-REG-001 — User can view regulations by category

**Purpose**
Confirm that regulations are organized by Compliance, HRD, and Legal categories.

**Preconditions**
- User has the Regulations read permission.
- Regulations exist in the system.

**Steps**
1. Sign in and navigate to Intranet.
2. Select a regulation category (Compliance, HRD, or Legal).
3. Observe the regulation list.

**Expected Result**
- Regulations for the selected category are displayed.
- Each entry shows title, visible-to roles, attachment count, and created date.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-REG-002 — User can search regulations by title

**Purpose**
Confirm that search functionality works on the regulations list.

**Preconditions**
- Multiple regulations exist.

**Steps**
1. Navigate to the regulations page.
2. Enter a search term in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results match the entered term against regulation titles.
- Search updates in real time.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-REG-003 — User can view regulation detail with attachments

**Purpose**
Confirm that regulation detail shows full content and downloadable attachments.

**Preconditions**
- A regulation with attachments exists.

**Steps**
1. Navigate to the regulations page.
2. Click on a regulation row.
3. Observe the detail page.

**Expected Result**
- Regulation detail page opens showing full content.
- Attachments are listed and downloadable.
- Role visibility badges are displayed.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-REG-004 — User can create a regulation with role visibility settings

**Purpose**
Confirm that regulations can be created with specific role visibility.

**Preconditions**
- User has the Regulations creation permission.
- User is on the regulations create page.

**Steps**
1. Navigate to the regulations page.
2. Click **Create Regulation**.
3. Enter title and details.
4. Select visible-to roles.
5. Attach files if needed.
6. Save the regulation.

**Expected Result**
- Regulation is created successfully.
- Role visibility settings are saved.
- Regulation appears in the list.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-REG-005 — User can only see regulations matching their roles

**Purpose**
Confirm that role-based visibility filtering works correctly.

**Preconditions**
- Regulations with different role visibility settings exist.
- User has specific roles assigned.

**Steps**
1. Sign in as a user with specific roles.
2. Navigate to the regulations page.
3. Observe the regulation list.

**Expected Result**
- Only regulations whose visible-to roles include the user's roles are shown.
- Regulations not visible to the user's roles are hidden.
- Admin sees all regulations.

**Priority**
Critical

**Category**
Permission

---

#### QA-INTRANET-REG-006 — User can edit an existing regulation

**Purpose**
Confirm that regulations can be updated.

**Preconditions**
- User has the Regulations editing permission.
- An existing regulation is in the system.

**Steps**
1. Navigate to the regulations page.
2. Open a regulation detail.
3. Click Edit.
4. Modify title or details.
5. Save changes.

**Expected Result**
- Regulation is updated successfully.
- Changes are reflected in the list and detail view.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-REG-007 — User can delete a regulation with confirmation

**Purpose**
Confirm that deleting a regulation requires confirmation.

**Preconditions**
- User has the Regulations deletion permission.
- An existing regulation is in the system.

**Steps**
1. Navigate to the regulations page.
2. Open a regulation detail.
3. Click Delete.
4. Confirm the deletion.

**Expected Result**
- Confirmation dialog appears before deletion.
- Regulation is removed from the list after confirmation.
- Deletion is irreversible.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-REG-008 — Regulation creation requires at least one visible-to role

**Purpose**
Confirm that regulations cannot be created without role visibility.

**Preconditions**
- User has the Regulations creation permission.

**Steps**
1. Navigate to the regulations create page.
2. Fill in title and details but leave visible-to roles empty.
3. Attempt to save.

**Expected Result**
- Form validation catches the missing role selection.
- Save is blocked until at least one role is selected.

**Priority**
High

**Category**
Validation

---

#### QA-INTRANET-REG-009 — Unsaved changes trigger discard confirmation on close

**Purpose**
Confirm that navigating away from an unsaved regulation form prompts for confirmation.

**Preconditions**
- User is editing a regulation and has made changes.

**Steps**
1. Open a regulation for editing.
2. Make changes to the form.
3. Attempt to close the form or navigate away.
4. Observe the dialog.

**Expected Result**
- Confirmation dialog appears asking to save or discard changes.
- User can choose to stay, discard, or cancel.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-REG-010 — User cannot create a regulation without required fields

**Purpose**
Confirm that validation blocks incomplete regulation creation.

**Preconditions**
- User has the Regulations creation permission.

**Steps**
1. Navigate to the regulations create page.
2. Leave title or details empty.
3. Attempt to save.

**Expected Result**
- Form validation catches missing required fields.
- Save is blocked until all required fields are filled.

**Priority**
High

**Category**
Validation

---

## Notifications

#### QA-INTRANET-NOTIF-001 — User can view notifications in the notification center

**Purpose**
Confirm that the notifications page displays the user's notifications.

**Preconditions**
- User is signed in.
- Notifications exist for the user.

**Steps**
1. Sign in and navigate to **Notifications**.
2. Observe the notification list.

**Expected Result**
- Notifications are displayed with type, title, message, and timestamp.
- Unread notifications are visually distinguished.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-NOTIF-002 — User can filter notifications by type

**Purpose**
Confirm that notification type filters work correctly.

**Preconditions**
- Notifications of different types exist (Announcement, Mention, Item Update, Action Item).

**Steps**
1. Navigate to the Notifications page.
2. Select a notification type filter.
3. Observe the filtered results.

**Expected Result**
- Only notifications of the selected type are shown.
- Filter updates the list dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-NOTIF-003 — User can mark a notification as read

**Purpose**
Confirm that marking a notification as read updates its status.

**Preconditions**
- Unread notifications exist.

**Steps**
1. Navigate to the Notifications page.
2. Click on an unread notification.
3. Observe the status change.

**Expected Result**
- Notification is marked as read.
- Visual indicator changes to reflect read status.
- Unread count decreases.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-NOTIF-004 — User can delete a notification

**Purpose**
Confirm that notifications can be deleted.

**Preconditions**
- Notifications exist.

**Steps**
1. Navigate to the Notifications page.
2. Delete a notification.
3. Observe the result.

**Expected Result**
- Notification is removed from the list.
- Unread counts are updated.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-NOTIF-005 — Notification badge updates when new notifications arrive

**Purpose**
Confirm that the unread count on the notification bell reflects new incoming notifications.

**Preconditions**
- User is signed in.

**Steps**
1. Sign in as a user with no unread notifications.
2. Receive a new notification.
3. Observe the notification bell badge.

**Expected Result**
- Badge appears or updates to show the new unread count.
- Badge disappears when all notifications are read.

**Priority**
Medium

**Category**
Happy Path

---

## Admin Panel

#### QA-INTRANET-ADMIN-001 — Administrator can view the admin dashboard

**Purpose**
Confirm that the admin dashboard is accessible and shows relevant stats.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to **Admin Dashboard**.
3. Observe the dashboard content.

**Expected Result**
- Admin dashboard loads successfully.
- Stat cards and quick-nav links are visible.
- Recent activity feed is displayed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-002 — Administrator can manage users

**Purpose**
Confirm that admin can view, create, edit, and deactivate users.

**Preconditions**
- User has admin permissions.
- Users exist in the system.

**Steps**
1. Navigate to **Admin > Users**.
2. Search for a user.
3. Edit a user's details.
4. Deactivate a user.

**Expected Result**
- User list is displayed with search and filter capabilities.
- User details can be edited and saved.
- Deactivated user cannot sign in.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-003 — Administrator can manage roles and permissions

**Purpose**
Confirm that admin can create, edit, and assign roles.

**Preconditions**
- User has admin permissions.
- Roles exist in the system.

**Steps**
1. Navigate to **Admin > Roles**.
2. Create a new role.
3. Edit a role's permissions.
4. Assign a user to the role.

**Expected Result**
- New role is created and appears in the list.
- Role permissions can be modified and saved.
- Assigned user gains the role's permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-004 — Administrator can view audit logs

**Purpose**
Confirm that audit logs are accessible and filterable.

**Preconditions**
- User has admin permissions.
- Audit log entries exist.

**Steps**
1. Navigate to **Admin > Audit Logs**.
2. Apply filters (action type, date range).
3. Observe the filtered results.

**Expected Result**
- Audit logs are displayed in a paginated table.
- Filters narrow the results correctly.
- Each entry shows action, entity, user, and timestamp.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-005 — Normal user cannot access the admin panel

**Purpose**
Confirm that non-admin users cannot access admin features.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to open the admin panel from navigation.
3. Attempt to open the admin URL directly.

**Expected Result**
- Admin menu is not visible in the sidebar.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-INTRANET-ADMIN-006 — Admin can navigate between admin sub-pages

**Purpose**
Confirm that admin sub-navigation works correctly.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to **Admin > Users**.
3. Use breadcrumbs or sidebar to navigate to **Admin > Roles**.
4. Observe the navigation.

**Expected Result**
- Navigation between admin sub-pages works smoothly.
- Breadcrumbs reflect the current location.
- Page state is preserved during navigation.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-007 — Admin dashboard shows user and role statistics

**Purpose**
Confirm that admin dashboard displays relevant statistics.

**Preconditions**
- User has admin permissions.
- Users and roles exist in the system.

**Steps**
1. Sign in as an admin user.
2. Navigate to the admin dashboard.
3. Observe the stat cards.

**Expected Result**
- Stat cards show total users, active/inactive counts, roles, and recent activity.
- Quick-nav cards link to Users, Roles, and Audit Logs.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-ADMIN-008 — Admin can manage system announcements

**Purpose**
Confirm that admin can create, edit, and delete system-wide announcements.

**Preconditions**
- User has admin permissions.
- System announcements exist.

**Steps**
1. Navigate to **Admin > Announcements**.
2. Create a new announcement.
3. Edit an existing announcement.
4. Delete an announcement.

**Expected Result**
- All CRUD operations work correctly.
- Changes are reflected on user dashboards.

**Priority**
High

**Category**
Happy Path

---

## Account Settings

#### QA-INTRANET-ACCOUNT-001 — User can view and edit their profile

**Purpose**
Confirm that the profile tab allows viewing and editing personal information.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Profile**.
2. View current profile information.
3. Edit the name field.
4. Save changes.

**Expected Result**
- Profile information is displayed.
- Changes are saved successfully.
- Updated name is reflected across the application.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-ACCOUNT-002 — User can change their password

**Purpose**
Confirm that password change works through account settings.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Security**.
2. Enter current password.
3. Enter a new password meeting requirements.
4. Confirm the new password.
5. Save.

**Expected Result**
- Password is changed successfully.
- User can sign in with the new password.

**Priority**
High

**Category**
Happy Path

---

#### QA-INTRANET-ACCOUNT-003 — User can manage active sessions

**Purpose**
Confirm that the sessions tab shows active sessions and allows revocation.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Sessions**.
2. Observe the active sessions list.
3. Revoke all other sessions.

**Expected Result**
- Active sessions are listed with details.
- Revoked sessions can no longer access the system.
- Current session remains active.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-INTRANET-ACCOUNT-004 — User can change theme preference

**Purpose**
Confirm that theme toggle persists across pages and sessions.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Preferences**.
2. Change the theme from Light to Dark.
3. Navigate to another page.
4. Refresh the browser.

**Expected Result**
- Theme changes immediately.
- Theme persists after page navigation and refresh.

**Priority**
Low

**Category**
Happy Path

---

#### QA-INTRANET-ACCOUNT-005 — Password change requires the current password

**Purpose**
Confirm that changing a password requires entering the current password.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Security**.
2. Leave the current password field empty.
3. Enter a new password.
4. Attempt to save.

**Expected Result**
- System requires the current password.
- Password change is blocked until the current password is provided.

**Priority**
High

**Category**
Validation

---

## Permissions

#### QA-INTRANET-PERM-001 — User without Intranet permission cannot access Intranet

**Purpose**
Confirm that users without Intranet app permission are blocked from the application.

**Preconditions**
- User does not have Intranet permission.
- User is signed in to the system.

**Steps**
1. Sign in as a user without Intranet permission.
2. Attempt to open the Intranet application from the switcher.
3. Attempt to open the Intranet URL directly.

**Expected Result**
- Intranet is not visible in the application switcher.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-INTRANET-PERM-002 — User can only see regulations matching their roles

**Purpose**
Confirm that role-based regulation visibility is enforced.

**Preconditions**
- User has specific roles assigned.
- Regulations with different role visibility settings exist.

**Steps**
1. Sign in as a user with specific roles.
2. Navigate to the regulations page.
3. Observe which regulations are visible.

**Expected Result**
- Only regulations visible to the user's roles are shown.
- Regulations not matching the user's roles are hidden.
- Admin sees all regulations.

**Priority**
Critical

**Category**
Permission

---

#### QA-INTRANET-PERM-003 — User without announcement permission cannot manage announcements

**Purpose**
Confirm that announcement management is restricted to authorized users.

**Preconditions**
- User does not have the intranet announcements permission.

**Steps**
1. Sign in as a user without announcement permission.
2. Attempt to open the announcements management page.
3. Attempt to open the management URL directly.

**Expected Result**
- Management interface is not accessible.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-INTRANET-PERM-004 — Admin user can access all intranet features

**Purpose**
Confirm that admin users bypass all permission checks.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to all Intranet pages.
3. Perform actions on each page.

**Expected Result**
- All Intranet features are accessible.
- All CRUD and management actions are available.

**Priority**
High

**Category**
Permission

---

## Coverage Quality Check

- [x] Every major user-facing module covered
- [x] Critical business flows covered (announcements, regulations, admin)
- [x] Important validations covered (required fields, role visibility, password change)
- [x] Permission-sensitive actions covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Implementation Status

- **READY**: Dashboard, Announcements (system + intranet), Regulations, Notifications, Account Settings, Admin Panel
- **LIMITED**: Regulation file attachment upload behavior requires backend verification
- **STUB**: None

## Coverage Gaps

- Real-time notification delivery timing may vary in test environments.
- Dual priority encoding (admin uses 0=HIGH vs intranet uses 1=HIGH) is an implementation detail not visible to QA.
- BroadcastChannel cross-tab notification sync is difficult to test manually.

---

Implementation Reference:
`src/routes/_protected/` — route definitions
`src/components/features/` — feature components
`src/services/` — API service layer
`src/stores/` — Zustand stores
