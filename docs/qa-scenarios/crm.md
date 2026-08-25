# CRM Manual QA Scenario Catalog

## Scope

CRM is a sales and trading operations application within the CSSI ecosystem. It manages accounts, contacts, leads, prospects, and stock/portfolio data. This catalog covers the actual implemented features in `cssi-crm-front`, including dashboard widgets, CRUD operations, search/filter/pagination, and permission-based access. Note: Trading modules (Account Statement, Stock Portfolio, Trade History, Trade Report) use client-side mock services and are noted as not yet connected to real APIs.

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Dashboard | KPI Cards, Widgets, Announcements, Module Nav | 6 |
| Accounts | Create, Edit, View Detail, Delete, Search | 9 |
| Contacts | Create, Edit, View Detail, Delete, Link to Account | 9 |
| Leads | Create, Edit, View Detail, Delete, Duplicate | 7 |
| Prospects | Create, Edit, View Detail, Delete, Pipeline | 7 |
| Stock | View, Search, Filter, Pagination | 5 |
| Search & Filters | Global search, Column filters, Advanced filters | 5 |
| Pagination | Page navigation, Page size | 3 |
| Permissions | Module access, Action gating | 6 |
| **Total** | | **60** |

---

## Dashboard

#### QA-CRM-DASH-001 — User can view the dashboard with KPI summary

**Purpose**
Confirm that the dashboard loads and displays key metrics and widgets.

**Preconditions**
- User is signed in with CRM access.
- System has some data.

**Steps**
1. Sign in and navigate to CRM.
2. Observe the dashboard home page.

**Expected Result**
- Dashboard loads successfully.
- KPI cards display relevant metrics.
- Widget grid shows charts and summaries.
- Module navigation bar is visible.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-DASH-002 — User can see announcement widget on dashboard

**Purpose**
Confirm that system announcements appear in the dashboard widget.

**Preconditions**
- Active announcements exist in the system.
- User is signed in with CRM access.

**Steps**
1. Sign in and navigate to CRM dashboard.
2. Locate the Announcements widget.
3. Click on an announcement item.

**Expected Result**
- Announcements are displayed in the widget.
- Clicking an announcement navigates to the announcement detail.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-DASH-003 — Stock chart widget displays data correctly

**Purpose**
Confirm that the stock/performance chart renders with available data.

**Preconditions**
- User is signed in with CRM access.
- Stock data exists in the system.

**Steps**
1. Sign in and navigate to CRM dashboard.
2. Locate the Stock chart widget.
3. Observe the chart display.

**Expected Result**
- Chart renders with data points.
- Axis labels and legend are readable.
- No rendering errors occur.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-DASH-004 — User sees empty state when no data is available

**Purpose**
Confirm that dashboard handles empty data gracefully.

**Preconditions**
- User is signed in with CRM access.
- No data exists in the system.

**Steps**
1. Sign in and navigate to CRM dashboard.
2. Observe the dashboard pages.

**Expected Result**
- Empty state messages are shown where appropriate.
- No errors or crashes occur.
- Widgets display placeholder or "No data" state.

**Priority**
Medium

**Category**
Edge Case

---

#### QA-CRM-DASH-005 — User can switch between module tabs on dashboard

**Purpose**
Confirm that multi-module users can switch context via the module navigation bar.

**Preconditions**
- User has access to multiple CRM modules.

**Steps**
1. Sign in and navigate to CRM dashboard.
2. Click on a different module tab.
3. Observe the dashboard content update.

**Expected Result**
- Dashboard content updates to reflect the selected module.
- KPIs and widgets change based on module context.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-DASH-006 — Dashboard shows error state with retry option when data fails to load

**Purpose**
Confirm that the dashboard handles API failures gracefully.

**Preconditions**
- User is signed in with CRM access.

**Steps**
1. Sign in and navigate to CRM dashboard.
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

## Accounts

#### QA-CRM-ACCT-001 — User can create a new account with valid information

**Purpose**
Confirm that a user can create a new account record.

**Preconditions**
- User has CREATE permission for Accounts module.
- User is signed in with CRM access.

**Steps**
1. Navigate to the Accounts page.
2. Click **Create New Account**.
3. Fill in all required fields.
4. Save the account.

**Expected Result**
- Account is created successfully.
- Account appears in the list.
- User can open the account detail page.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-ACCT-002 — User cannot save an account when required information is missing

**Purpose**
Confirm that form validation blocks incomplete account creation.

**Preconditions**
- User has CREATE permission for Accounts module.

**Steps**
1. Navigate to the Accounts page.
2. Click **Create New Account**.
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

#### QA-CRM-ACCT-003 — User can search for an existing account

**Purpose**
Confirm that the search functionality finds accounts by name or other criteria.

**Preconditions**
- Multiple accounts exist in the system.

**Steps**
1. Navigate to the Accounts page.
2. Enter a partial account name in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results update to show matching accounts.
- Search works with partial matches.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-ACCT-004 — User can open an account detail page

**Purpose**
Confirm that clicking an account row opens its detailed view.

**Preconditions**
- At least one account exists.

**Steps**
1. Navigate to the Accounts page.
2. Click on an account row.
3. Observe the detail page.

**Expected Result**
- Account detail page opens.
- All account information is displayed in collapsible sections.
- Actions bar shows available actions based on permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-ACCT-005 — User can edit an existing account

**Purpose**
Confirm that a user with UPDATE permission can modify account details.

**Preconditions**
- User has UPDATE permission for Accounts module.
- An existing account is in the system.

**Steps**
1. Open an account detail page.
2. Click the Edit button.
3. Modify some fields.
4. Save changes.

**Expected Result**
- Account details are updated.
- Changes are reflected in the detail view and list.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-ACCT-006 — User can delete an account with confirmation

**Purpose**
Confirm that deleting an account requires confirmation and removes the record.

**Preconditions**
- User has DELETE permission for Accounts module.
- An existing account is in the system.

**Steps**
1. Open an account detail page.
2. Click the Delete button.
3. Confirm the deletion in the dialog.
4. Observe the result.

**Expected Result**
- Confirmation dialog appears before deletion.
- Account is removed from the list after confirmation.
- Deletion is irreversible.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-ACCT-007 — User cannot delete an account without DELETE permission

**Purpose**
Confirm that users without DELETE permission cannot delete accounts.

**Preconditions**
- User does not have DELETE permission for Accounts module.
- An account exists in the system.

**Steps**
1. Navigate to the Accounts page.
2. Open an account detail page.
3. Look for the Delete button.

**Expected Result**
- Delete button is not visible.
- User cannot perform the delete action.

**Priority**
Critical

**Category**
Permission

---

#### QA-CRM-ACCT-008 — User can filter accounts by status

**Purpose**
Confirm that filtering by account status displays the correct subset.

**Preconditions**
- Accounts with different statuses exist.

**Steps**
1. Navigate to the Accounts page.
2. Select a status filter from the dropdown.
3. Observe the filtered results.

**Expected Result**
- Only accounts matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-ACCT-009 — User can view the relationship between account and its contacts

**Purpose**
Confirm that account detail shows associated contacts.

**Preconditions**
- An account exists with linked contacts.

**Steps**
1. Open an account detail page.
2. Locate the contacts section.
3. Observe the linked contacts.

**Expected Result**
- Associated contacts are listed in the account detail.
- User can click into each contact for more details.

**Priority**
Medium

**Category**
Happy Path

---

## Contacts

#### QA-CRM-CONTACT-001 — User can create a contact with valid information

**Purpose**
Confirm that a user can create a new contact record.

**Preconditions**
- User has CREATE permission for Contacts module.
- User is signed in with CRM access.

**Steps**
1. Navigate to the Contacts page.
2. Click **Create New Contact**.
3. Fill in all required fields.
4. Save the contact.

**Expected Result**
- Contact is created successfully.
- Contact appears in the list.
- User can open the contact detail page.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-CONTACT-002 — User cannot save a contact when required information is missing

**Purpose**
Confirm that form validation blocks incomplete contact creation.

**Preconditions**
- User has CREATE permission for Contacts module.

**Steps**
1. Navigate to the Contacts page.
2. Click **Create New Contact**.
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

#### QA-CRM-CONTACT-003 — User can find an existing contact using search

**Purpose**
Confirm that the search functionality finds contacts by name or other criteria.

**Preconditions**
- Multiple contacts exist in the system.

**Steps**
1. Navigate to the Contacts page.
2. Enter a partial contact name in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results update to show matching contacts.
- Search works with partial matches.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-CONTACT-004 — User can open a contact detail page

**Purpose**
Confirm that clicking a contact row opens its detailed view.

**Preconditions**
- At least one contact exists.

**Steps**
1. Navigate to the Contacts page.
2. Click on a contact row.
3. Observe the detail page.

**Expected Result**
- Contact detail page opens.
- All contact information is displayed in collapsible sections.
- Actions bar shows available actions based on permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-CONTACT-005 — User can edit an existing contact

**Purpose**
Confirm that a user with UPDATE permission can modify contact details.

**Preconditions**
- User has UPDATE permission for Contacts module.
- An existing contact is in the system.

**Steps**
1. Open a contact detail page.
2. Click the Edit button.
3. Modify some fields.
4. Save changes.

**Expected Result**
- Contact details are updated.
- Changes are reflected in the detail view and list.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-CONTACT-006 — User can delete a contact with confirmation

**Purpose**
Confirm that deleting a contact requires confirmation and removes the record.

**Preconditions**
- User has DELETE permission for Contacts module.
- An existing contact is in the system.

**Steps**
1. Open a contact detail page.
2. Click the Delete button.
3. Confirm the deletion in the dialog.
4. Observe the result.

**Expected Result**
- Confirmation dialog appears before deletion.
- Contact is removed from the list after confirmation.
- Deletion is irreversible.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-CONTACT-007 — User cannot delete a contact without DELETE permission

**Purpose**
Confirm that users without DELETE permission cannot delete contacts.

**Preconditions**
- User does not have DELETE permission for Contacts module.
- A contact exists in the system.

**Steps**
1. Navigate to the Contacts page.
2. Open a contact detail page.
3. Look for the Delete button.

**Expected Result**
- Delete button is not visible.
- User cannot perform the delete action.

**Priority**
Critical

**Category**
Permission

---

#### QA-CRM-CONTACT-008 — User can filter contacts by status

**Purpose**
Confirm that filtering by contact status displays the correct subset.

**Preconditions**
- Contacts with different statuses exist.

**Steps**
1. Navigate to the Contacts page.
2. Select a status filter from the dropdown.
3. Observe the filtered results.

**Expected Result**
- Only contacts matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-CONTACT-009 — Search results update according to selected filters

**Purpose**
Confirm that search and filters work together correctly.

**Preconditions**
- Multiple contacts exist with various attributes.

**Steps**
1. Navigate to the Contacts page.
2. Enter a search term.
3. Apply one or more filters (status, category, etc.).
4. Observe the combined results.

**Expected Result**
- Results reflect both the search term and all applied filters.
- Clearing filters restores the full search result set.

**Priority**
Medium

**Category**
Happy Path

---

## Leads

#### QA-CRM-LEAD-001 — User can create a lead with valid information

**Purpose**
Confirm that a user can create a new lead record.

**Preconditions**
- User has CREATE permission for Leads module.
- User is signed in with CRM access.

**Steps**
1. Navigate to the Leads page.
2. Click **Create New Lead**.
3. Fill in all required fields.
4. Save the lead.

**Expected Result**
- Lead is created successfully.
- Lead appears in the list.
- User can open the lead detail page.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-LEAD-002 — User cannot save a lead when required information is missing

**Purpose**
Confirm that form validation blocks incomplete lead creation.

**Preconditions**
- User has CREATE permission for Leads module.

**Steps**
1. Navigate to the Leads page.
2. Click **Create New Lead**.
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

#### QA-CRM-LEAD-003 — User can search for an existing lead

**Purpose**
Confirm that the search functionality finds leads by name or other criteria.

**Preconditions**
- Multiple leads exist in the system.

**Steps**
1. Navigate to the Leads page.
2. Enter a partial lead name in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results update to show matching leads.
- Search works with partial matches.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-LEAD-004 — User can view a lead detail page

**Purpose**
Confirm that clicking a lead row opens its detailed view.

**Preconditions**
- At least one lead exists.

**Steps**
1. Navigate to the Leads page.
2. Click on a lead row.
3. Observe the detail page.

**Expected Result**
- Lead detail page opens.
- All lead information is displayed in collapsible sections.
- Actions bar shows available actions based on permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-LEAD-005 — User can edit an existing lead

**Purpose**
Confirm that a user with UPDATE permission can modify lead details.

**Preconditions**
- User has UPDATE permission for Leads module.
- An existing lead is in the system.

**Steps**
1. Open a lead detail page.
2. Click the Edit button.
3. Modify some fields.
4. Save changes.

**Expected Result**
- Lead details are updated.
- Changes are reflected in the detail view and list.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-LEAD-006 — User cannot delete a lead without DELETE permission

**Purpose**
Confirm that users without DELETE permission cannot delete leads.

**Preconditions**
- User does not have DELETE permission for Leads module.
- A lead exists in the system.

**Steps**
1. Navigate to the Leads page.
2. Open a lead detail page.
3. Look for the Delete button.

**Expected Result**
- Delete button is not visible.
- User cannot perform the delete action.

**Priority**
Critical

**Category**
Permission

---

#### QA-CRM-LEAD-007 — User can filter leads by status

**Purpose**
Confirm that filtering by lead status displays the correct subset.

**Preconditions**
- Leads with different statuses exist.

**Steps**
1. Navigate to the Leads page.
2. Select a status filter from the dropdown.
3. Observe the filtered results.

**Expected Result**
- Only leads matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

## Prospects

#### QA-CRM-PROS-001 — User can create a prospect with valid information

**Purpose**
Confirm that a user can create a new prospect record.

**Preconditions**
- User has CREATE permission for Prospects module.
- User is signed in with CRM access.

**Steps**
1. Navigate to the Prospects page.
2. Click **Create New Prospect**.
3. Fill in all required fields.
4. Save the prospect.

**Expected Result**
- Prospect is created successfully.
- Prospect appears in the list.
- User can open the prospect detail page.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-PROS-002 — User cannot save a prospect when required information is missing

**Purpose**
Confirm that form validation blocks incomplete prospect creation.

**Preconditions**
- User has CREATE permission for Prospects module.

**Steps**
1. Navigate to the Prospects page.
2. Click **Create New Prospect**.
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

#### QA-CRM-PROS-003 — User can view a prospect detail page

**Purpose**
Confirm that clicking a prospect row opens its detailed view.

**Preconditions**
- At least one prospect exists.

**Steps**
1. Navigate to the Prospects page.
2. Click on a prospect row.
3. Observe the detail page.

**Expected Result**
- Prospect detail page opens.
- All prospect information is displayed in collapsible sections.
- Actions bar shows available actions based on permissions.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-PROS-004 — User can edit an existing prospect

**Purpose**
Confirm that a user with UPDATE permission can modify prospect details.

**Preconditions**
- User has UPDATE permission for Prospects module.
- An existing prospect is in the system.

**Steps**
1. Open a prospect detail page.
2. Click the Edit button.
3. Modify some fields.
4. Save changes.

**Expected Result**
- Prospect details are updated.
- Changes are reflected in the detail view and list.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-PROS-005 — User cannot delete a prospect without DELETE permission

**Purpose**
Confirm that users without DELETE permission cannot delete prospects.

**Preconditions**
- User does not have DELETE permission for Prospects module.
- A prospect exists in the system.

**Steps**
1. Navigate to the Prospects page.
2. Open a prospect detail page.
3. Look for the Delete button.

**Expected Result**
- Delete button is not visible.
- User cannot perform the delete action.

**Priority**
Critical

**Category**
Permission

---

#### QA-CRM-PROS-006 — User can filter prospects by pipeline stage

**Purpose**
Confirm that filtering by pipeline stage displays the correct subset.

**Preconditions**
- Prospects in different pipeline stages exist.

**Steps**
1. Navigate to the Prospects page.
2. Select a pipeline stage filter.
3. Observe the filtered results.

**Expected Result**
- Only prospects matching the selected stage are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-PROS-007 — User can search for an existing prospect

**Purpose**
Confirm that the search functionality finds prospects by name or other criteria.

**Preconditions**
- Multiple prospects exist in the system.

**Steps**
1. Navigate to the Prospects page.
2. Enter a partial prospect name in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results update to show matching prospects.
- Search works with partial matches.

**Priority**
High

**Category**
Happy Path

---

## Stock

#### QA-CRM-STOCK-001 — User can view the stock list

**Purpose**
Confirm that the stock page loads and displays available stock data.

**Preconditions**
- User has READ permission for the Stock module.
- Stock data exists in the system.

**Steps**
1. Navigate to the Stock page.
2. Observe the stock list.

**Expected Result**
- Stock data is displayed in a table.
- Columns show relevant stock information.
- No errors occur during load.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-STOCK-002 — User can search for a stock item

**Purpose**
Confirm that search functionality works on the stock list.

**Preconditions**
- Multiple stock items exist.

**Steps**
1. Navigate to the Stock page.
2. Enter a search term in the search box.
3. Observe the results.

**Expected Result**
- Stock list filters to show matching items.
- Search updates in real time.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-STOCK-003 — User can filter stocks by category

**Purpose**
Confirm that category filtering works on the stock list.

**Preconditions**
- Stocks with different categories exist.

**Steps**
1. Navigate to the Stock page.
2. Select a category from the filter dropdown.
3. Observe the filtered results.

**Expected Result**
- Only stocks matching the selected category are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-STOCK-004 — User can move between pages of stock results

**Purpose**
Confirm that pagination works correctly on the stock list.

**Preconditions**
- More stock items exist than fit on one page.

**Steps**
1. Navigate to the Stock page.
2. Click through the pagination controls.
3. Observe the page content updates.

**Expected Result**
- Each page shows the correct subset of stock items.
- Pagination controls are clickable and functional.
- Page size can be adjusted if supported.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-STOCK-005 — Stock portfolio and trade history use mock data

**Purpose**
Confirm that trading modules display mock data since they are not yet connected to real APIs.

**Preconditions**
- User has access to trading modules.

**Steps**
1. Navigate to Stock Portfolio or Trade History.
2. Observe the displayed data.
3. Check for any indicators of mock/test data.

**Expected Result**
- Trading modules display data without errors.
- Data is clearly mock/fake data (not real transactions).
- User can interact with the UI normally.

**Priority**
Low

**Category**
Edge Case

---

## Search & Filters

#### QA-CRM-SEARCH-001 — Global search finds records across the current module

**Purpose**
Confirm that the search box finds relevant records in the active module.

**Preconditions**
- Records exist in the current module.

**Steps**
1. Navigate to any module page (Accounts, Contacts, Leads, Prospects, or Stock).
2. Enter a search term that matches an existing record.
3. Observe the filtered results.

**Expected Result**
- Search returns matching records.
- Search works with partial matches.
- Clearing the search restores the full list.

**Priority**
High

**Category**
Happy Path

---

#### QA-CRM-SEARCH-002 — Advanced filters narrow results correctly

**Purpose**
Confirm that advanced filter combinations work as expected.

**Preconditions**
- Records with varying attributes exist.

**Steps**
1. Navigate to a module with advanced filters.
2. Apply multiple filter criteria simultaneously.
3. Observe the combined results.

**Expected Result**
- Results reflect all applied filter criteria.
- Filters can be combined and removed independently.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-SEARCH-003 — Sort columns change the display order

**Purpose**
Confirm that clicking column headers sorts the data.

**Preconditions**
- A data table with sortable columns exists.

**Steps**
1. Navigate to a module page with a data table.
2. Click on a column header to sort.
3. Click again to reverse the sort order.

**Expected Result**
- Table rows reorder according to the selected column.
- Sort direction indicator updates (ascending/descending).
- Sort persists during the session.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-SEARCH-004 — Filter reset clears all active filters

**Purpose**
Confirm that resetting filters restores the full unfiltered view.

**Preconditions**
- One or more filters are applied on a module page.

**Steps**
1. Apply several filters on a module page.
2. Click the Reset/Clear filters button.
3. Observe the table.

**Expected Result**
- All filters are cleared.
- Full unfiltered dataset is displayed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-SEARCH-005 — Search and filters work together correctly

**Purpose**
Confirm that search and filters combine logically.

**Preconditions**
- Records with varying attributes exist.

**Steps**
1. Navigate to a module page.
2. Enter a search term.
3. Apply one or more filters.
4. Observe the combined results.

**Expected Result**
- Results reflect both search and filter criteria.
- Intersection logic is applied correctly.

**Priority**
Medium

**Category**
Happy Path

---

## Pagination

#### QA-CRM-PAGE-001 — User can navigate between pages of results

**Purpose**
Confirm that pagination controls work across module tables.

**Preconditions**
- More records exist than fit on one page.

**Steps**
1. Navigate to any module page with a data table.
2. Click the next page button.
3. Click the previous page button.
4. Jump to a specific page number.

**Expected Result**
- Each page shows the correct subset of records.
- Pagination controls are responsive and functional.
- Total page count is accurate.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-CRM-PAGE-002 — Page size selector changes the number of rows per page

**Purpose**
Confirm that adjusting page size updates the number of displayed rows.

**Preconditions**
- A data table supports page size selection.

**Steps**
1. Navigate to a module page with a data table.
2. Change the page size using the selector.
3. Observe the number of rows displayed.

**Expected Result**
- Number of rows per page changes to the selected size.
- Pagination adjusts accordingly.

**Priority**
Low

**Category**
Happy Path

---

#### QA-CRM-PAGE-003 — Last page shows remaining records correctly

**Purpose**
Confirm that the final page displays only the remaining records without errors.

**Preconditions**
- Total records do not divide evenly by page size.

**Steps**
1. Navigate to the last page of any module table.
2. Observe the displayed records.

**Expected Result**
- Last page shows the remaining records (fewer than full page size).
- No empty rows or errors appear.
- Pagination controls indicate the last page.

**Priority**
Low

**Category**
Edge Case

---

## Permissions

#### QA-CRM-PERM-001 — User without CRM permission cannot access CRM

**Purpose**
Confirm that users without CRM access are blocked from the application.

**Preconditions**
- User does not have CRM permission.
- User is signed in to the system.

**Steps**
1. Sign in as a user without CRM permission.
2. Attempt to open the CRM application from the switcher.
3. Attempt to open the CRM URL directly.

**Expected Result**
- CRM is not visible in the application switcher.
- Direct URL access is denied or redirected.

**Priority**
Critical

**Category**
Permission

---

#### QA-CRM-PERM-002 — User can only see modules they have READ permission for

**Purpose**
Confirm that module visibility is controlled by READ permission.

**Preconditions**
- User has limited module permissions.

**Steps**
1. Sign in as a user with limited CRM module permissions.
2. Open the CRM application.
3. Observe the sidebar navigation.

**Expected Result**
- Only modules with READ permission are visible in the sidebar.
- Modules without permission are hidden.

**Priority**
High

**Category**
Permission

---

#### QA-CRM-PERM-003 — User without CREATE permission cannot see the create button

**Purpose**
Confirm that the create button is hidden when the user lacks CREATE permission.

**Preconditions**
- User does not have CREATE permission for a module.

**Steps**
1. Navigate to a module page.
2. Look for the create button.

**Expected Result**
- Create button is not visible.
- User cannot initiate a create action.

**Priority**
High

**Category**
Permission

---

#### QA-CRM-PERM-004 — User without UPDATE permission cannot edit records

**Purpose**
Confirm that edit actions are blocked without UPDATE permission.

**Preconditions**
- User does not have UPDATE permission for a module.
- A record exists in the system.

**Steps**
1. Navigate to a module and open a record detail.
2. Look for the Edit button.

**Expected Result**
- Edit button is not visible.
- User cannot modify the record.

**Priority**
High

**Category**
Permission

---

#### QA-CRM-PERM-005 — Admin user can access all CRM modules

**Purpose**
Confirm that admin users bypass module-level permission restrictions.

**Preconditions**
- User has admin permissions.

**Steps**
1. Sign in as an admin user.
2. Navigate to CRM.
3. Open all available modules.

**Expected Result**
- All CRM modules are accessible.
- All CRUD actions are available.

**Priority**
High

**Category**
Permission

---

#### QA-CRM-PERM-006 — System blocks unauthorized action attempts via direct API calls

**Purpose**
Confirm that the backend enforces permissions even if the UI is bypassed.

**Preconditions**
- User does not have permission for a specific action.

**Steps**
1. Sign in as a user without a specific permission.
2. Attempt an action that requires that permission (via UI or API).

**Expected Result**
- System returns an authorization error.
- Action is not completed.
- User cannot perform unauthorized operations.

**Priority**
Critical

**Category**
Permission

---

## Coverage Quality Check

- [x] Every major user-facing module covered
- [x] Critical business flows covered (CRUD, search, filters, permissions)
- [x] Important validations covered (required fields, permission checks)
- [x] Permission-sensitive actions covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Coverage Gaps

- Trading modules (Account Statement, Stock Portfolio, Trade History, Trade Report) use mock data and are not connected to real APIs. These scenarios focus on UI behavior only.
- Lead duplicate detection and subscription features are stubbed and may not function in the current implementation.
- Changelog dialogs on account/contact/lead detail pages reference hardcoded empty arrays and are not fully wired to backend.

---

Implementation Reference:
`src/routes/` — route definitions
`src/components/features/` — feature components (accounts, contacts, leads, prospects, stock)
`src/services/` — API service layer
`src/lib/` — utility functions
`src/hooks/` — custom hooks (useTableState, useLookups)
