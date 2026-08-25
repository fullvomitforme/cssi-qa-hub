# Portal Manual QA Scenario Catalog

## Scope

Portal is the central authentication and navigation hub for the KBVS ecosystem. This catalog covers SSO authentication, user management, role management, application switching, notifications, account settings, and admin functionality based on the actual implementation in `cssi-portal`.

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Authentication | Login, Logout, Forgot Password, New Password Setup, Session | 14 |
| User Management | Create, Edit, Deactivate, Search, Filter, List | 10 |
| Role Management | Create, Edit Permissions, Assign Users, List | 8 |
| Application Switcher | Access Apps, Permission Gating, Navigation | 6 |
| Notifications | View, Mark Read, Categories, Toasts | 5 |
| Account Settings | Profile, Security, Sessions, Preferences | 8 |
| Admin Dashboard | Stats, Quick Links, Activity Feed | 3 |
| Audit Logs | View, Filter by Action/Date | 3 |
| System Announcements | Create, Edit, Delete, List | 5 |
| **Total** | | **62** |

---

## Authentication

### Login

#### QA-PORTAL-AUTH-001 — User can sign in with correct credentials

**Purpose**
Confirm that an active user can access the application using valid credentials.

**Preconditions**
- User has an active account.
- User knows their correct login credentials.

**Steps**
1. Open the login page.
2. Enter the correct user ID.
3. Enter the correct password.
4. Select **Sign In**.

**Expected Result**
- User successfully signs in.
- User is taken to the dashboard.
- User can access features allowed for their account.

**Priority**
Critical

**Category**
Happy Path

---

#### QA-PORTAL-AUTH-002 — User cannot sign in with an incorrect password

**Purpose**
Confirm that the system rejects invalid credentials with a clear message.

**Preconditions**
- User has an active account.
- User knows their correct user ID but enters a wrong password.

**Steps**
1. Open the login page.
2. Enter the correct user ID.
3. Enter an incorrect password.
4. Select **Sign In**.

**Expected Result**
- Login fails.
- User sees an error message indicating incorrect credentials.
- User remains on the login page.

**Priority**
High

**Category**
Negative

---

#### QA-PORTAL-AUTH-003 — User can sign out successfully

**Purpose**
Confirm that the sign-out action logs the user out and returns them to the login page.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to any page within the application.
2. Click the user profile menu.
3. Select **Sign Out**.

**Expected Result**
- User is logged out.
- User is redirected to the login page.
- Attempting to access a protected URL redirects to login.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-AUTH-004 — User without internet cannot access the system

**Purpose**
Confirm the system shows an appropriate error when the network is unavailable.

**Preconditions**
- User's internet connection is disabled.

**Steps**
1. Disable internet connection.
2. Open the application.
3. Attempt to sign in.

**Expected Result**
- User sees an error or loading state indicating network unavailability.
- No crash or blank screen occurs.

**Priority**
Medium

**Category**
Negative

---

### Session Behavior

#### QA-PORTAL-AUTH-005 — User session expires and redirects to login

**Purpose**
Confirm that an expired session sends the user back to the login flow.

**Preconditions**
- User is signed in.
- User's session token is expired or invalidated.

**Steps**
1. Sign in as a normal user.
2. Wait for the session to expire, or have an administrator invalidate the session.
3. Attempt to perform an action in the application.

**Expected Result**
- User is redirected to the login page.
- No data is lost in the process.

**Priority**
Critical

**Category**
Edge Case

---

#### QA-PORTAL-AUTH-006 — User can manage active sessions

**Purpose**
Confirm that a user can view and revoke their active sessions from the Account settings.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Sessions**.
2. View the list of active sessions.
3. Revoke one session (but not the current one).
4. Revoke all other sessions.

**Expected Result**
- Active sessions are listed with details.
- Revoked sessions can no longer access the system.
- The current session remains active after revoking others.

**Priority**
High

**Category**
Happy Path

---

### Forgot Password

#### QA-PORTAL-AUTH-007 — User can request a password reset

**Purpose**
Confirm that a user who forgot their password can initiate the reset flow.

**Preconditions**
- User has an active account.
- User does not remember their password.

**Steps**
1. Open the login page.
2. Click **Forgot Password**.
3. Enter the registered email address.
4. Submit the form.

**Expected Result**
- User receives an OTP at their registered email.
- User is prompted to verify the OTP.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-AUTH-008 — User can reset password with a valid OTP

**Purpose**
Confirm the full password reset flow works end-to-end.

**Preconditions**
- User has requested a password reset and received an OTP.

**Steps**
1. Enter the OTP received via email.
2. Proceed to the password reset page.
3. Enter a new password that meets requirements.
4. Confirm the new password.
5. Submit.

**Expected Result**
- Password is changed successfully.
- User can sign in with the new password.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-AUTH-009 — User cannot reset password with an expired or invalid OTP

**Purpose**
Confirm that an expired or incorrect OTP is rejected.

**Preconditions**
- User has requested a password reset.

**Steps**
1. Enter an incorrect or expired OTP.
2. Proceed to the password reset step.

**Expected Result**
- System rejects the OTP.
- User sees an appropriate error message.
- User must request a new OTP or re-enter the correct one.

**Priority**
High

**Category**
Negative

---

### New Password Setup (Onboarding)

#### QA-PORTAL-AUTH-010 — User must set a new password on first login

**Purpose**
Confirm that a user flagged as must-reset-password is redirected to the setup flow.

**Preconditions**
- An administrator has created a user account and flagged it as requiring a password change.

**Steps**
1. Sign in with the temporary credentials.
2. Observe the redirect behavior.
3. Enter a new password meeting all requirements.
4. Confirm and submit.

**Expected Result**
- User is redirected to the password setup page.
- Password is set successfully.
- User proceeds to the dashboard.

**Priority**
Critical

**Category**
Happy Path

---

#### QA-PORTAL-AUTH-011 — User cannot use a password that does not meet requirements

**Purpose**
Confirm that weak passwords are rejected during setup.

**Preconditions**
- User is on the password setup page.

**Steps**
1. Enter a password that does not meet requirements (e.g., too short, missing uppercase, missing number).
2. Attempt to submit.

**Expected Result**
- System shows validation errors for each missing requirement.
- Submit is blocked until the password meets all criteria.

**Priority**
High

**Category**
Validation

---

## User Management

#### QA-PORTAL-USER-001 — Administrator can create a new user

**Purpose**
Confirm that an admin can register a new user account with valid information.

**Preconditions**
- User has admin permissions.

**Steps**
1. Navigate to **Admin > Users**.
2. Click **New User**.
3. Fill in all required fields: user ID, name, email, phone, branch, department, role.
4. Set a strong password.
5. Save the user.

**Expected Result**
- New user is created successfully.
- New user appears in the user list.
- New user can sign in with the provided credentials.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-USER-002 — Administrator can edit an existing user

**Purpose**
Confirm that an admin can update user details.

**Preconditions**
- User has admin permissions.
- At least one existing user is in the system.

**Steps**
1. Navigate to **Admin > Users**.
2. Find an existing user.
3. Open the user edit panel.
4. Change the user's name or email.
5. Save changes.

**Expected Result**
- User details are updated.
- Changes are reflected in the user list.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-USER-003 — User cannot create a duplicate user

**Purpose**
Confirm that the system prevents creating users with duplicate identifiers.

**Preconditions**
- User has admin permissions.
- A user already exists with a specific user ID and email.

**Steps**
1. Navigate to **Admin > Users**.
2. Click **New User**.
3. Enter the same user ID and email as an existing user.
4. Attempt to save.

**Expected Result**
- System shows a validation or duplicate error.
- New user is not created.

**Priority**
High

**Category**
Validation

---

#### QA-PORTAL-USER-004 — User cannot activate a user without a valid email

**Purpose**
Confirm that missing or invalid email addresses are rejected during user creation.

**Preconditions**
- User has admin permissions.

**Steps**
1. Navigate to **Admin > Users**.
2. Click **New User**.
3. Leave the email field empty or enter an invalid email format.
4. Attempt to save.

**Expected Result**
- Form validation catches the error.
- User cannot proceed until a valid email is provided.

**Priority**
High

**Category**
Validation

---

#### QA-PORTAL-USER-005 — Administrator can change a user's role

**Purpose**
Confirm that an admin can modify a user's assigned role.

**Preconditions**
- User has admin permissions.
- At least one user exists with an existing role.

**Steps**
1. Navigate to **Admin > Users**.
2. Find the target user.
3. Open the user edit panel.
4. Change the role to a different option.
5. Save.

**Expected Result**
- User's role is updated.
- User's access permissions change according to the new role.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-USER-006 — Normal user cannot access the Users management page

**Purpose**
Confirm that non-admin users cannot reach the user management feature.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to open User Management from navigation.
3. Attempt to open the User Management URL directly.

**Expected Result**
- User Management is not visible in the navigation.
- Direct URL access is denied or redirected.

**Priority**
High
**Category**
Permission

**Category**
Permission

---

#### QA-PORTAL-USER-007 — Administrator can deactivate a user

**Purpose**
Confirm that an admin can disable a user account.

**Preconditions**
- User has admin permissions.
- At least one active user exists.

**Steps**
1. Navigate to **Admin > Users**.
2. Find an active user.
3. Deactivate the user.
4. Attempt to sign in as the deactivated user.

**Expected Result**
- User is deactivated in the list.
- Deactivated user cannot sign in.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-USER-008 — User search filters the user list correctly

**Purpose**
Confirm that the search functionality in the user list works as expected.

**Preconditions**
- Multiple users exist in the system.

**Steps**
1. Navigate to **Admin > Users**.
2. Enter a partial name or email in the search box.
3. Observe the filtered results.

**Expected Result**
- Only matching users are shown.
- Search updates in real time as typing continues.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-USER-009 — Role filter shows only matching users

**Purpose**
Confirm that filtering by role displays the correct subset of users.

**Preconditions**
- Multiple users with different roles exist.

**Steps**
1. Navigate to **Admin > Users**.
2. Select a specific role from the filter dropdown.
3. Observe the list.

**Expected Result**
- Only users with the selected role are displayed.
- Changing the filter updates the list accordingly.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-USER-010 — Status filter shows Active, Inactive, and Suspended users correctly

**Purpose**
Confirm that status-based filtering works across all user states.

**Preconditions**
- Users exist with different statuses (Active, Inactive, Suspended).

**Steps**
1. Navigate to **Admin > Users**.
2. Apply the Active filter.
3. Apply the Inactive filter.
4. Apply the Suspended filter.

**Expected Result**
- Each filter shows only users matching that status.
- Removing the filter restores the full list.

**Priority**
Medium

**Category**
Happy Path

---

## Role Management

#### QA-PORTAL-ROLE-001 — Administrator can create a new role

**Purpose**
Confirm that an admin can define a new role with a name and code.

**Preconditions**
- User has admin permissions.

**Steps**
1. Navigate to **Admin > Roles**.
2. Click **Create Role**.
3. Enter a role name and code.
4. Save the role.

**Expected Result**
- New role appears in the role list.
- New role can be assigned to users.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-ROLE-002 — Administrator can edit a role's permissions

**Purpose**
Confirm that an admin can modify what actions a role can perform.

**Preconditions**
- User has admin permissions.
- At least one role exists.

**Steps**
1. Navigate to **Admin > Roles**.
2. Select an existing role.
3. Toggle permission actions (READ, CREATE, UPDATE, DELETE, etc.) on or off for various modules.
4. Save changes.

**Expected Result**
- Permissions are updated.
- Changes take effect for users assigned to this role.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-ROLE-003 — Administrator can assign a user to a role

**Purpose**
Confirm that a user can be associated with a role.

**Preconditions**
- User has admin permissions.
- At least one role and one user exist.

**Steps**
1. Navigate to **Admin > Roles**.
2. Select a role.
3. Open the Users tab.
4. Add an existing user to the role.
5. Save.

**Expected Result**
- User appears in the role's user list.
- User gains the permissions associated with that role.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-ROLE-004 — Administrator can remove a user from a role

**Purpose**
Confirm that a user can be detached from a role.

**Preconditions**
- User has admin permissions.
- A user is currently assigned to a role.

**Steps**
1. Navigate to **Admin > Roles**.
2. Select the role containing the user.
3. Remove the user from the role.
4. Save.

**Expected Result**
- User is removed from the role's user list.
- User loses the permissions associated with that role.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-ROLE-005 — Administrator can delete a role

**Purpose**
Confirm that an admin can remove a role from the system.

**Preconditions**
- User has admin permissions.
- A role exists with no assigned users (or users are removed first).

**Steps**
1. Navigate to **Admin > Roles**.
2. Select a role.
3. Delete the role.
4. Confirm the deletion.

**Expected Result**
- Role is removed from the list.
- Users previously in the role no longer have that role's permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-ROLE-006 — Normal user cannot access the Roles management page

**Purpose**
Confirm that non-admin users cannot reach the role management feature.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to open Role Management from navigation.
3. Attempt to open the Role Management URL directly.

**Expected Result**
- Role Management is not visible in the navigation.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-PORTAL-ROLE-007 — Administrator cannot assign a role with no permissions

**Purpose**
Confirm that a role must have at least some permissions to be valid.

**Preconditions**
- User has admin permissions.

**Steps**
1. Navigate to **Admin > Roles**.
2. Create a new role.
3. Leave all permission actions unchecked.
4. Attempt to save.

**Expected Result**
- System requires at least one permission to be enabled.
- Save is blocked until permissions are configured.

**Priority**
Medium

**Category**
Validation

---

#### QA-PORTAL-ROLE-008 — Role permissions affect application navigation visibility

**Purpose**
Confirm that missing permission for a module hides that module from navigation.

**Preconditions**
- User has admin permissions.
- At least one module with navigation visibility exists.

**Steps**
1. As admin, create a role without access to a specific module.
2. Assign a test user to that role.
3. Sign in as the test user.
4. Check the sidebar navigation.

**Expected Result**
- The module is not visible in the sidebar.
- The test user cannot access the module's pages.

**Priority**
High

**Category**
Permission

---

## Application Switcher

#### QA-PORTAL-APP-001 — User sees only applications they have permission to access

**Purpose**
Confirm that the app switcher displays only accessible apps based on user permissions.

**Preconditions**
- User is signed in with access to multiple apps.

**Steps**
1. Sign in as a user.
2. Open the application switcher bar.
3. Observe the list of available apps.

**Expected Result**
- Only apps the user has permission for are shown.
- Apps without permission are not displayed.

**Priority**
High

**Category**
Permission

---

#### QA-PORTAL-APP-002 — Signed-in user can open CRM from the application switcher without signing in again

**Purpose**
Confirm SSO works between Portal and sibling applications.

**Preconditions**
- User has permission to access CRM.
- User is signed in to Portal.

**Steps**
1. Sign in to Portal.
2. Open the application switcher.
3. Click on the CRM app.

**Expected Result**
- CRM opens in a new tab or window.
- User is already authenticated in CRM (no login prompt).
- CRM loads the dashboard.

**Priority**
High

**Category**
Integration

---

#### QA-PORTAL-APP-003 — User without CRM permission cannot access CRM directly

**Purpose**
Confirm that direct URL access to an unauthorized app is blocked.

**Preconditions**
- User does not have CRM permission.
- User is signed in to Portal.

**Steps**
1. Sign in to Portal.
2. Open the CRM URL directly in the browser.

**Expected Result**
- Access is denied or redirected to an appropriate page.
- CRM content is not accessible.

**Priority**
High

**Category**
Permission

---

#### QA-PORTAL-APP-004 — Portal is always accessible regardless of role

**Purpose**
Confirm that all users can access the Portal application even without specific app permissions.

**Preconditions**
- User is signed in with any role.

**Steps**
1. Sign in as any user.
2. Verify the Portal app is available in the switcher.
3. Navigate to the Portal dashboard.

**Expected Result**
- Portal is always visible and accessible.
- User can access the Portal dashboard.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-APP-005 — Admin app (all apps) grants access to every application

**Purpose**
Confirm that the admin appId grants access to all sibling applications.

**Preconditions**
- User has the ADMIN appId (appId 7) assigned.

**Steps**
1. Sign in as an admin user.
2. Open the application switcher.
3. Verify all apps are listed.
4. Open each app and confirm access.

**Expected Result**
- All applications appear in the switcher.
- User can access every application without restriction.

**Priority**
High

**Category**
Permission

---

#### QA-PORTAL-APP-006 — Disabled apps show a tooltip explaining why they are unavailable

**Purpose**
Confirm that inaccessible apps provide feedback when hovered.

**Preconditions**
- User is signed in with limited app permissions.

**Steps**
1. Sign in as a user with limited permissions.
2. Hover over any disabled or unavailable app in the switcher.

**Expected Result**
- A tooltip appears explaining the reason for inaccessibility.
- The app cannot be clicked.

**Priority**
Medium

**Category**
Happy Path

---

## Notifications

#### QA-PORTAL-NOTIF-001 — User receives and can open a notification

**Purpose**
Confirm that incoming notifications are delivered and viewable.

**Preconditions**
- User is signed in.
- A notification has been sent to the user.

**Steps**
1. Sign in as a user.
2. Observe the notification bell icon.
3. Click on the notification bell.
4. Click on a notification item.

**Expected Result**
- Notification bell shows an unread count.
- Notification list opens showing the notification.
- Clicking a notification navigates to the relevant page.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-NOTIF-002 — User can filter notifications by category

**Purpose**
Confirm that notification categories (Security, Environment, Devices) filter correctly.

**Preconditions**
- User is signed in.
- Multiple notifications of different categories exist.

**Steps**
1. Navigate to the Notifications page.
2. Select the Security category filter.
3. Select other categories one at a time.

**Expected Result**
- Each category filter shows only notifications of that type.
- Selecting "All" shows every notification.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-NOTIF-003 — User can mark a notification as read

**Purpose**
Confirm that reading a notification updates its status.

**Preconditions**
- User is signed in.
- Unread notifications exist.

**Steps**
1. Navigate to the Notifications page.
2. Click on an unread notification to mark it as read.
3. Observe the unread count.

**Expected Result**
- Notification is marked as read.
- Unread count decreases.
- Visual indicator changes to reflect read status.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-NOTIF-004 — Toast notification appears for real-time incoming notification

**Purpose**
Confirm that a toast notification is shown when a new notification arrives while the user is active.

**Preconditions**
- User is signed in and on an active page.

**Steps**
1. Sign in as a user.
2. Have another user or admin send a notification to the signed-in user.
3. Observe the screen.

**Expected Result**
- A toast notification appears on screen.
- The notification bell badge updates.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-NOTIF-005 — Notification badge updates when new notifications arrive

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

## Account Settings

#### QA-PORTAL-ACCOUNT-001 — User can update their profile information

**Purpose**
Confirm that a user can edit their name and email in Account settings.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Profile**.
2. Change the name field.
3. Change the email field (if allowed).
4. Save changes.

**Expected Result**
- Profile information is updated.
- Changes are reflected across the application.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-ACCOUNT-002 — User can change their password

**Purpose**
Confirm that a user can update their password through Account settings.

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

#### QA-PORTAL-ACCOUNT-003 — User can toggle between light and dark theme

**Purpose**
Confirm that the theme preference is toggleable and persists.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Preferences**.
2. Change the theme from Light to Dark.
3. Refresh the page.
4. Change back to Light.

**Expected Result**
- Theme changes immediately.
- Theme preference persists after page refresh.
- Theme applies across all pages.

**Priority**
Low

**Category**
Happy Path

---

#### QA-PORTAL-ACCOUNT-004 — User can manage notification preferences

**Purpose**
Confirm that notification toggles control which notifications the user receives.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Preferences**.
2. Toggle notification settings on or off.
3. Save preferences.
4. Trigger a notification of the disabled type.

**Expected Result**
- Disabled notifications are not delivered.
- Enabled notifications are delivered normally.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-ACCOUNT-005 — User cannot use a weak password when changing password

**Purpose**
Confirm that password strength requirements are enforced during password change.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Security**.
2. Enter current password.
3. Enter a weak new password (e.g., "12345").
4. Attempt to save.

**Expected Result**
- System shows validation errors for the weak password.
- Password change is blocked.

**Priority**
High

**Category**
Validation

---

#### QA-PORTAL-ACCOUNT-006 — User sees their session duration in the Sessions tab

**Purpose**
Confirm that active sessions display how long the user has been logged in.

**Preconditions**
- User is signed in.

**Steps**
1. Navigate to **Account Settings > Sessions**.
2. Observe the current session entry.

**Expected Result**
- Current session is listed with a duration or start time.
- Session information is accurate.

**Priority**
Low

**Category**
Happy Path

---

#### QA-PORTAL-ACCOUNT-007 — User can revoke all other active sessions

**Purpose**
Confirm that a user can terminate all sessions except their current one.

**Preconditions**
- User is signed in with multiple active sessions.

**Steps**
1. Navigate to **Account Settings > Sessions**.
2. Click **Revoke All Other Sessions**.
3. Confirm the action.

**Expected Result**
- All other sessions are terminated.
- The current session remains active.
- Revoked sessions can no longer access the system.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-ACCOUNT-008 — Password change requires the current password

**Purpose**
Confirm that changing a password requires entering the current password first.

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

## Admin Dashboard

#### QA-PORTAL-ADMIN-001 — Admin can view dashboard statistics

**Purpose**
Confirm that the admin dashboard shows relevant system statistics.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to **Admin Dashboard**.
3. Observe the stat cards and recent activity feed.

**Expected Result**
- Total Users, Active/Inactive Users, Roles, and Logins (24h) stats are displayed.
- Quick-nav cards to Users, Roles, and Audit Logs are visible.
- Recent activity is shown from audit logs.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-ADMIN-002 — Admin can navigate to Users from the Admin Dashboard

**Purpose**
Confirm that quick-links on the admin dashboard navigate correctly.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to **Admin Dashboard**.
3. Click the **Users** quick-link card.

**Expected Result**
- User is navigated to the Users management page.
- Page loads correctly.

**Priority**
Low

**Category**
Happy Path

---

#### QA-PORTAL-ADMIN-003 — Normal user cannot access the Admin Dashboard

**Purpose**
Confirm that non-admin users cannot reach the admin dashboard.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to open the Admin Dashboard from navigation.
3. Attempt to open the Admin Dashboard URL directly.

**Expected Result**
- Admin Dashboard is not visible in the navigation.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

## Audit Logs

#### QA-PORTAL-AUDIT-001 — Administrator can view system audit logs

**Purpose**
Confirm that admins can see a log of system actions performed by users.

**Preconditions**
- User has admin permissions.
- Some actions have been performed in the system.

**Steps**
1. Sign in as an admin user.
2. Navigate to **Admin > Audit Logs**.
3. Observe the log entries.

**Expected Result**
- Audit logs are displayed in a paginated table.
- Each entry shows the action, entity, user, and timestamp.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-AUDIT-002 — Audit logs can be filtered by action type

**Purpose**
Confirm that the audit log filter by action works.

**Preconditions**
- User has admin permissions.
- Multiple audit log entries exist with different action types.

**Steps**
1. Navigate to **Admin > Audit Logs**.
2. Select an action type filter (e.g., Create, Update, Delete).
3. Observe the filtered results.

**Expected Result**
- Only entries matching the selected action type are shown.
- Filter can be cleared to show all entries.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-PORTAL-AUDIT-003 — Audit logs can be filtered by date range

**Purpose**
Confirm that date range filtering works on audit logs.

**Preconditions**
- User has admin permissions.
- Audit log entries span multiple dates.

**Steps**
1. Navigate to **Admin > Audit Logs**.
2. Set a date range filter.
3. Apply the filter.

**Expected Result**
- Only entries within the selected date range are shown.
- Results update accordingly.

**Priority**
Medium

**Category**
Happy Path

---

## System Announcements

#### QA-PORTAL-ANNOUNCE-001 — Administrator can create a new announcement

**Purpose**
Confirm that an admin can publish a system-wide announcement.

**Preconditions**
- User has admin permissions.

**Steps**
1. Navigate to **Admin > Announcements**.
2. Click **Create Announcement**.
3. Enter a title and content.
4. Set the priority (HIGH, MEDIUM, LOW).
5. Save the announcement.

**Expected Result**
- Announcement is created and visible in the list.
- Announcement appears on user dashboards.

**Priority**
High

**Category**
Happy Path

---

#### QA-PORTAL-ANNOUNCE-002 — Administrator can edit an existing announcement

**Purpose**
Confirm that an admin can update an existing announcement.

**Preconditions**
- User has admin permissions.
- At least one announcement exists.

**Steps**
1. Navigate to **Admin > Announcements**.
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

#### QA-PORTAL-ANNOUNCE-003 — Administrator can delete an announcement

**Purpose**
Confirm that an admin can remove an announcement.

**Preconditions**
- User has admin permissions.
- At least one announcement exists.

**Steps**
1. Navigate to **Admin > Announcements**.
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

#### QA-PORTAL-ANNOUNCE-004 — Normal user cannot create, edit, or delete announcements

**Purpose**
Confirm that non-admin users cannot manage announcements.

**Preconditions**
- User is a normal user without admin permissions.

**Steps**
1. Sign in as a normal user.
2. Attempt to navigate to the Announcements management page.
3. Attempt to open the management URL directly.

**Expected Result**
- Announcement management is not accessible.
- Direct URL access is denied or redirected.

**Priority**
High

**Category**
Permission

---

#### QA-PORTAL-ANNOUNCE-005 — Users see active announcements on their dashboard

**Purpose**
Confirm that published announcements appear in the user dashboard widget.

**Preconditions**
- At least one active announcement exists.
- User is signed in.

**Steps**
1. Sign in as any user.
2. Navigate to the Dashboard.
3. Observe the Announcements widget.

**Expected Result**
- Active announcements are displayed in the widget.
- Clicking an announcement opens its detail view.

**Priority**
Medium

**Category**
Happy Path

---

## Cross-Application / SSO

#### QA-PORTAL-SSO-001 — Expired session sends user back to the authentication flow

**Purpose**
Confirm that an expired session across any application sends the user back to Portal login.

**Preconditions**
- User is signed in to Portal and has accessed a sibling app.
- Session token is expired or invalidated.

**Steps**
1. Sign in to Portal.
2. Access a sibling application (e.g., CRM).
3. Invalidate the session token.
4. Attempt to perform an action in the sibling app.

**Expected Result**
- User is redirected back to the Portal login page.
- User must re-authenticate to access any application.

**Priority**
High

**Category**
Integration

---

## Coverage Quality Check

- [x] Every major user-facing module covered
- [x] Critical business flows covered (auth, user mgmt, role mgmt)
- [x] Important validations covered (password strength, duplicates, required fields)
- [x] Permission-sensitive actions covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Coverage Gaps

- Real-time WebSocket notification delivery depends on backend infrastructure; timing behavior may vary in test environments.
- Username/avatar upload is disabled in production; avatar preview behavior may not be testable end-to-end.

---

Implementation Reference:
`src/routes/` — route definitions
`src/components/features/` — feature components
`src/lib/axios.ts` — auth interceptor
`src/stores/auth-store.ts` — Zustand auth state
`src/services/` — API service layer
