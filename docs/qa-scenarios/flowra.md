# Flowra Manual QA Scenario Catalog

## Scope

Flowra (FLOWRA) is a Business Process Management platform for managing account opening workflows, sales pipelines, and compliance. This catalog covers the actual Opening Account implementation in `cssi-front-flowra`, including the 6-step form wizard, draft/autosave behavior, validation, submission, and detail view. Other business process modules (Compliance, CSO Process, Purchase, Risk Management, Settlement) are present in navigation but not covered as they are stub implementations.

| Module | Features | Scenarios |
| ------ | -------: | --------: |
| Opening Account List | View, Search, Filter, Pagination | 6 |
| Product Form | Client info, Addresses, Email, Fee settings | 8 |
| Institution Form | Company details, URLs, Expiry dates | 5 |
| Personal Form | Identity, Address, Occupation, Required fields | 10 |
| Spouse/Parents Form | Optional family data | 4 |
| Bank Form | Bank accounts, Custody | 5 |
| Financial Form | Investment profile, Lead source | 5 |
| Draft & Autosave | Save, Restore, Unsaved changes guard | 7 |
| Validation | Required fields, Cross-field rules | 8 |
| Submission | Create, Edit, Success/Error | 6 |
| Detail View | Read-only display, Actions | 5 |
| Permissions | Module access, Action gating | 4 |
| **Total** | | **73** |

---

## Opening Account List

#### QA-FLOWRA-OA-001 — User can view the list of Opening Accounts

**Purpose**
Confirm that the OA list page loads and displays existing accounts.

**Preconditions**
- User has READ permission for the Opening Account module.
- At least one OA exists in the system.

**Steps**
1. Sign in and navigate to Opening Account.
2. Observe the list view.

**Expected Result**
- OA list loads successfully.
- Table shows OA records with key columns.
- Search and filter controls are visible.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-OA-002 — User can search for an Opening Account

**Purpose**
Confirm that searching by client name or other criteria works.

**Preconditions**
- Multiple OAs exist in the system.

**Steps**
1. Navigate to the Opening Account list.
2. Enter a partial client name in the search box.
3. Observe the filtered results.

**Expected Result**
- Search results update to show matching OAs.
- Search works with partial matches.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-OA-003 — User can filter OAs by status

**Purpose**
Confirm that filtering by account status displays the correct subset.

**Preconditions**
- OAs with different statuses exist.

**Steps**
1. Navigate to the OA list.
2. Select a status filter from the dropdown.
3. Observe the filtered results.

**Expected Result**
- Only OAs matching the selected status are shown.
- Filter updates the table dynamically.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-OA-004 — User can move between pages of OA results

**Purpose**
Confirm that pagination works on the OA list.

**Preconditions**
- More OAs exist than fit on one page.

**Steps**
1. Navigate to the OA list.
2. Click through the pagination controls.

**Expected Result**
- Each page shows the correct subset of OAs.
- Pagination controls are responsive and functional.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-OA-005 — User without READ permission cannot access the OA list

**Purpose**
Confirm that users without OA READ permission are blocked.

**Preconditions**
- User does not have the Opening Account read permission.

**Steps**
1. Sign in as a user without OA permission.
2. Attempt to open the Opening Account page.
3. Attempt to open the OA URL directly.

**Expected Result**
- Opening Account is not visible in the sidebar.
- Direct URL access redirects to the dashboard.

**Priority**
High
**Category**
Permission

**Category**
Permission

---

#### QA-FLOWRA-OA-006 — User with READ permission but no CREATE cannot see Create button

**Purpose**
Confirm that the create button respects CREATE permission.

**Preconditions**
- User has READ but not CREATE permission for OAs.

**Steps**
1. Navigate to the OA list.
2. Look for the Create New button.

**Expected Result**
- Create button is not visible.
- User cannot start a new OA.

**Priority**
High

**Category**
Permission

---

## Product Form

#### QA-FLOWRA-PROD-001 — User can fill product information successfully

**Purpose**
Confirm that the product form accepts valid input and allows progression.

**Preconditions**
- User has CREATE permission for OAs.
- User is on the OA creation page.

**Steps**
1. Navigate to Create New Opening Account.
2. Fill in all required product fields: account service, process status, client type, client status, client name, phone, mobile, primary address.
3. Add at least one email address and mark it as primary.
4. Proceed to the next step.

**Expected Result**
- Form accepts all valid inputs.
- User can advance to the next form step.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-PROD-002 — User cannot proceed with missing required product fields

**Purpose**
Confirm that required product fields block progression.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Leave one or more required product fields empty.
2. Attempt to proceed to the next step.

**Expected Result**
- System prevents advancing.
- Error messages indicate which fields are required.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PROD-003 — User must provide at least one email address

**Purpose**
Confirm that the email requirement is enforced.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Do not add any email addresses.
2. Attempt to proceed.

**Expected Result**
- System prevents advancing.
- Error message indicates at least one email is required.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PROD-004 — User must mark exactly one email as primary

**Purpose**
Confirm that the primary email invariant is enforced.

**Preconditions**
- User is on the Product form step.
- Multiple email addresses have been added.

**Steps**
1. Add two or more email addresses.
2. Do not mark any as primary, or mark more than one as primary.
3. Attempt to proceed.

**Expected Result**
- System prevents advancing.
- Error message indicates exactly one primary email is required.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PROD-005 — User can copy alternate address from primary address

**Purpose**
Confirm that the copy-address feature works.

**Preconditions**
- User is on the Product form step.
- Primary address has been filled.

**Steps**
1. Fill in the primary address.
2. Check the "Copy from primary" checkbox for alternate address.
3. Observe the alternate address fields.

**Expected Result**
- Alternate address fields are populated with the primary address values.
- User can edit the copied values if needed.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-PROD-006 — Website URL accepts https:// prefix or bare domain

**Purpose**
Confirm that website URL validation is flexible.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Enter a website URL with https:// prefix.
2. Save and proceed.
3. Edit and enter a bare domain without https://.
4. Save and proceed.

**Expected Result**
- Both formats are accepted.
- URL is normalized to https:// format on submission.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-PROD-007 — User can view fee settings section

**Purpose**
Confirm that the fee settings fields are accessible and editable.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Navigate to the Product form step.
2. Locate the Fee Settings section.
3. Enter values in the fee fields.
4. Save.

**Expected Result**
- Fee fields are visible and editable.
- Values are saved correctly.

**Priority**
Low

**Category**
Happy Path

---

#### QA-FLOWRA-PROD-008 — User can return to edit product information after proceeding

**Purpose**
Confirm that users can navigate back and modify previous steps.

**Preconditions**
- User has started an OA and completed the Product step.

**Steps**
1. Proceed through the form to a later step.
2. Use the back navigation to return to the Product step.
3. Modify product information.
4. Save changes.

**Expected Result**
- User can navigate back to previous steps.
- Changes are saved when returning to a step.
- Previously entered data in later steps is preserved.

**Priority**
Medium

**Category**
Happy Path

---

## Institution Form

#### QA-FLOWRA-INST-001 — User can fill institution information

**Purpose**
Confirm that the institution form accepts valid input.

**Preconditions**
- User is on the Institution form step.

**Steps**
1. Fill in institution details: established date, line of business, website, NPWP number, TDP number.
2. Fill in expiry dates for relevant documents.
3. Proceed to the next step.

**Expected Result**
- Form accepts all valid inputs.
- User can advance to the next step.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-INST-002 — Invalid website URL is rejected

**Purpose**
Confirm that malformed URLs are caught during validation.

**Preconditions**
- User is on the Institution form step.

**Steps**
1. Enter an invalid URL (e.g., "not-a-url").
2. Attempt to proceed.

**Expected Result**
- System rejects the invalid URL.
- Error message indicates the URL format is incorrect.

**Priority**
Medium

**Category**
Validation

---

#### QA-FLOWRA-INST-003 — Institution form fields are optional

**Purpose**
Confirm that the institution step can be skipped if fields are truly optional.

**Preconditions**
- User is on the Institution form step.

**Steps**
1. Leave all institution fields empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding (if all fields are optional).
- No validation errors are shown.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-INST-004 — Expiry dates are validated as future dates where applicable

**Purpose**
Confirm that expiry date fields accept valid dates.

**Preconditions**
- User is on the Institution form step.

**Steps**
1. Enter an expiry date in the past.
2. Attempt to save.
3. Enter a future expiry date.
4. Save again.

**Expected Result**
- Past expiry dates may be accepted or rejected depending on business rules.
- Future expiry dates are accepted.

**Priority**
Low

**Category**
Validation

---

#### QA-FLOWRA-INST-005 — User can return to edit institution information

**Purpose**
Confirm that users can navigate back and modify institution data.

**Preconditions**
- User has completed the Institution step.

**Steps**
1. Navigate to a later step.
2. Use back navigation to return to the Institution step.
3. Modify institution information.
4. Save and proceed.

**Expected Result**
- User can edit institution data.
- Changes are preserved.

**Priority**
Medium

**Category**
Happy Path

---

## Personal Form

#### QA-FLOWRA-PERS-001 — User can fill personal information with all required fields

**Purpose**
Confirm that the personal form accepts valid input for all required fields.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Fill in all required personal fields: gender, marital status, NPWP number, ID type, ID card number, ID expiry date, place of birth, date of birth, religion, correspondence address, TC send to, monthly report, occupation, company name, position, line of business, length of employed, company address.
2. Proceed to the next step.

**Expected Result**
- Form accepts all valid inputs.
- User can advance to the next step.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-PERS-002 — User cannot proceed with missing required personal fields

**Purpose**
Confirm that required personal fields block progression.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Leave one or more required personal fields empty.
2. Attempt to proceed.

**Expected Result**
- System prevents advancing.
- Error messages indicate which fields are required.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PERS-003 — Date of birth is validated as a valid past date

**Purpose**
Confirm that date of birth cannot be set in the future.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Enter a future date for date of birth.
2. Attempt to proceed.
3. Enter a valid past date.
4. Proceed again.

**Expected Result**
- Future date of birth is rejected.
- Valid past date is accepted.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PERS-004 — ID expiry date must be after the ID issue date

**Purpose**
Confirm that ID expiry date validation works correctly.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Enter an ID expiry date that is before the ID card number entry date.
2. Attempt to proceed.
3. Enter a valid ID expiry date (after issue).
4. Proceed again.

**Expected Result**
- Invalid date range is rejected.
- Valid date range is accepted.

**Priority**
Medium

**Category**
Validation

---

#### QA-FLOWRA-PERS-005 — Correspondence address is required and validated

**Purpose**
Confirm that all correspondence address fields are required.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Leave correspondence address fields empty.
2. Attempt to proceed.
3. Fill in all correspondence address fields.
4. Proceed again.

**Expected Result**
- Empty correspondence address blocks progression.
- All required address fields must be filled.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PERS-006 — Company address is required and validated

**Purpose**
Confirm that all company address fields are required.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Leave company address fields empty.
2. Attempt to proceed.
3. Fill in all company address fields.
4. Proceed again.

**Expected Result**
- Empty company address blocks progression.
- All required address fields must be filled.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-PERS-007 — User can copy ID address from alternate address

**Purpose**
Confirm that the copy-address feature works for ID address.

**Preconditions**
- User is on the Personal form step.
- Alternate address has been filled.

**Steps**
1. Check the "Copy from alternate" checkbox for ID address.
2. Observe the ID address fields.

**Expected Result**
- ID address fields are populated with alternate address values.
- User can edit the copied values if needed.

**Priority**
Low

**Category**
Happy Path

---

#### QA-FLOWRA-PERS-008 — Lookup fields display correct labels not raw IDs

**Purpose**
Confirm that dropdown lookups show human-readable labels.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Open a lookup dropdown (e.g., gender, marital status, religion).
2. Select an option.
3. Observe the displayed value.

**Expected Result**
- Dropdown shows readable labels (e.g., "Male" not "1").
- Selected value is stored correctly for submission.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-PERS-009 — User can return to edit personal information

**Purpose**
Confirm that users can navigate back and modify personal data.

**Preconditions**
- User has completed the Personal step.

**Steps**
1. Navigate to a later step.
2. Use back navigation to return to the Personal step.
3. Modify personal information.
4. Save and proceed.

**Expected Result**
- User can edit personal data.
- Changes are preserved.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-PERS-010 — Spouse/Parents section is optional and can be skipped

**Purpose**
Confirm that the spouse section is not required.

**Preconditions**
- User is on the Spouse/Parents form step.

**Steps**
1. Leave all spouse/parents fields empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding without spouse data.
- No validation errors are shown.

**Priority**
Medium

**Category**
Happy Path

---

## Spouse/Parents Form

#### QA-FLOWRA-SPOUSE-001 — User can fill spouse information

**Purpose**
Confirm that the spouse form accepts valid input.

**Preconditions**
- User is on the Spouse/Parents form step.

**Steps**
1. Fill in spouse details: name, relation, ID number, place of birth, date of birth, address, contact info.
2. Proceed to the next step.

**Expected Result**
- Form accepts all valid inputs.
- User can advance to the next step.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-SPOUSE-002 — User can copy spouse address from primary address

**Purpose**
Confirm that the copy-address feature works for spouse address.

**Preconditions**
- User is on the Spouse/Parents form step.
- Primary address has been filled in the Product step.

**Steps**
1. Check the "Copy from primary" checkbox for spouse address.
2. Observe the spouse address fields.

**Expected Result**
- Spouse address fields are populated with primary address values.
- User can edit the copied values if needed.

**Priority**
Low

**Category**
Happy Path

---

#### QA-FLOWRA-SPOUSE-003 — Spouse financial information is optional

**Purpose**
Confirm that spouse financial fields are not required.

**Preconditions**
- User is on the Spouse/Parents form step.

**Steps**
1. Fill in basic spouse info but leave financial fields empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding.
- No validation errors for empty financial fields.

**Priority**
Low

**Category**
Happy Path

---

#### QA-FLOWRA-SPOUSE-004 — User can return to edit spouse information

**Purpose**
Confirm that users can navigate back and modify spouse data.

**Preconditions**
- User has completed the Spouse step.

**Steps**
1. Navigate to a later step.
2. Use back navigation to return to the Spouse step.
3. Modify spouse information.
4. Save and proceed.

**Expected Result**
- User can edit spouse data.
- Changes are preserved.

**Priority**
Low

**Category**
Happy Path

---

## Bank Form

#### QA-FLOWRA-BANK-001 — User can fill bank account information

**Purpose**
Confirm that the bank form accepts valid input.

**Preconditions**
- User is on the Bank form step.

**Steps**
1. Fill in bank details: bank name, branch, account number, account holder name.
2. Fill in a second bank account if desired.
3. Proceed to the next step.

**Expected Result**
- Form accepts all valid inputs.
- User can advance to the next step.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-BANK-002 — Bank name dropdown shows available banks

**Purpose**
Confirm that the bank dropdown is populated from the master data API.

**Preconditions**
- User is on the Bank form step.

**Steps**
1. Open the bank name dropdown.
2. Observe the available options.

**Expected Result**
- Dropdown shows a list of banks from the master data.
- User can select a bank from the list.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-BANK-003 — Bank account fields are optional

**Purpose**
Confirm that the bank step can be completed without bank information.

**Preconditions**
- User is on the Bank form step.

**Steps**
1. Leave all bank fields empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding (if bank fields are optional).
- No validation errors are shown.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-BANK-004 — User can return to edit bank information

**Purpose**
Confirm that users can navigate back and modify bank data.

**Preconditions**
- User has completed the Bank step.

**Steps**
1. Navigate to a later step.
2. Use back navigation to return to the Bank step.
3. Modify bank information.
4. Save and proceed.

**Expected Result**
- User can edit bank data.
- Changes are preserved.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-BANK-005 — Custody type is optional

**Purpose**
Confirm that custody type selection is not required.

**Preconditions**
- User is on the Bank form step.

**Steps**
1. Leave custody type empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding without custody type.
- No validation errors are shown.

**Priority**
Low

**Category**
Happy Path

---

## Financial Form

#### QA-FLOWRA-FIN-001 — User can fill financial and investment information

**Purpose**
Confirm that the financial form accepts valid input.

**Preconditions**
- User is on the Financial form step.

**Steps**
1. Fill in financial details: source of fund, investment experience, investment purpose, investment risk, investment objectives, fund/securities type.
2. Fill in sales information: lead source, sales code, assigned to.
3. Proceed to submission.

**Expected Result**
- Form accepts all valid inputs.
- User can proceed to submission.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-FIN-002 — Financial form fields are optional

**Purpose**
Confirm that the financial step can be completed without financial information.

**Preconditions**
- User is on the Financial form step.

**Steps**
1. Leave all financial fields empty.
2. Attempt to proceed.

**Expected Result**
- System allows proceeding (if financial fields are optional).
- No validation errors are shown.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-FIN-003 — Investment objectives are selected from static options

**Purpose**
Confirm that investment objectives use predefined values.

**Preconditions**
- User is on the Financial form step.

**Steps**
1. Open the investment objectives dropdown.
2. Observe the available options.

**Expected Result**
- Dropdown shows static options: Aggressive, Moderate, Conservative, Income, Preservation.
- User can select one option.

**Priority**
Low

**Category**
Happy Path

---

#### QA-FLOWRA-FIN-004 — User can return to edit financial information

**Purpose**
Confirm that users can navigate back and modify financial data.

**Preconditions**
- User has completed the Financial step.

**Steps**
1. Navigate to the submission page.
2. Use back navigation to return to the Financial step.
3. Modify financial information.
4. Save and proceed.

**Expected Result**
- User can edit financial data.
- Changes are preserved.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-FIN-005 — Sales information can be populated from lookup

**Purpose**
Confirm that sales code/name lookups work correctly.

**Preconditions**
- User is on the Financial form step.

**Steps**
1. Open the sales code dropdown.
2. Select a sales person.
3. Observe the sales name field.

**Expected Result**
- Selecting a sales code populates the sales name.
- Lookup values are fetched from the master data API.

**Priority**
Medium

**Category**
Happy Path

---

## Draft & Autosave

#### QA-FLOWRA-DRAFT-001 — User's draft is saved automatically as they fill the form

**Purpose**
Confirm that the autosave feature preserves progress.

**Preconditions**
- User has started creating a new OA.

**Steps**
1. Navigate to the OA creation page.
2. Fill in some fields on the Product step.
3. Navigate away from the page without submitting.
4. Return to the OA creation page.

**Expected Result**
- Previously entered data is restored.
- User can continue from where they left off.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-002 — User can leave and continue a saved draft later

**Purpose**
Confirm that draft persistence survives browser refresh and re-entry.

**Preconditions**
- User has started creating a new OA and saved some data.

**Steps**
1. Fill in data on multiple form steps.
2. Close the browser tab.
3. Reopen the application and navigate to the OA creation page.
4. Observe the form state.

**Expected Result**
- Previously entered data is restored across browser sessions.
- Current step indicator is preserved.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-003 — User is warned before navigating away with unsaved changes

**Purpose**
Confirm that the unsaved changes guard fires correctly.

**Preconditions**
- User has made changes to the form without saving.

**Steps**
1. Fill in some fields on the form.
2. Attempt to navigate away without saving.
3. Observe the dialog.

**Expected Result**
- A confirmation dialog appears asking to save changes.
- User can choose to stay, discard changes, or leave.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-004 — Draft is cleared after successful submission

**Purpose**
Confirm that submitting an OA clears the draft cache.

**Preconditions**
- User has a saved draft.

**Steps**
1. Fill in and submit a complete OA.
2. Navigate back to the OA creation page.
3. Observe the form state.

**Expected Result**
- Form is empty and ready for a new OA.
- Previous draft data is not carried over.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-005 — Draft is cleared when explicitly discarded

**Purpose**
Confirm that discarding a draft clears the saved data.

**Preconditions**
- User has a saved draft with unsaved changes.

**Steps**
1. Make changes to a draft.
2. Choose to discard changes when prompted.
3. Navigate back to the OA creation page.
4. Observe the form state.

**Expected Result**
- Draft data is cleared.
- Form is empty and ready for a new OA.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-006 — Editing an existing OA populates the form with current data

**Purpose**
Confirm that the edit flow hydrates the form from the backend.

**Preconditions**
- An OA exists in the system.

**Steps**
1. Navigate to an existing OA detail page.
2. Click the Edit button.
3. Observe the form state.

**Expected Result**
- Form fields are pre-populated with the OA's current data.
- All completed steps show their respective data.
- Spouse section starts empty (known limitation).

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DRAFT-007 — Autosave does not overwrite data from a later-visited step

**Purpose**
Confirm that autosave preserves data integrity across steps.

**Preconditions**
- User is editing an OA across multiple steps.

**Steps**
1. Fill in data on Step 1 and save.
2. Navigate to Step 2 and fill in data.
3. Return to Step 1 and modify data.
4. Save again.
5. Navigate back to Step 2.

**Expected Result**
- Data from each step is preserved independently.
- No data loss occurs when switching between steps.

**Priority**
Medium

**Category**
Edge Case

---

## Validation

#### QA-FLOWRA-VAL-001 — User cannot submit with required fields missing from any step

**Purpose**
Confirm that final submission validates all steps.

**Preconditions**
- User has filled most of the OA form but left some required fields empty.

**Steps**
1. Fill in most fields across all steps.
2. Leave at least one required field empty in any step.
3. Click Save Opening Account.

**Expected Result**
- Submission is blocked.
- Error message indicates required fields are missing.
- User is directed to the incomplete step.

**Priority**
Critical

**Category**
Validation

---

#### QA-FLOWRA-VAL-002 — User cannot submit with an invalid email format

**Purpose**
Confirm that email format validation works.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Enter an invalid email address (e.g., "invalid-email").
2. Mark it as primary.
3. Attempt to proceed.

**Expected Result**
- System rejects the invalid email format.
- Error message indicates the email is invalid.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-VAL-003 — User cannot submit if no primary email is marked

**Purpose**
Confirm that the primary email invariant is enforced at submission.

**Preconditions**
- User has added multiple emails but not marked any as primary.

**Steps**
1. Add two email addresses without marking either as primary.
2. Attempt to submit.

**Expected Result**
- Submission is blocked.
- Error message indicates exactly one primary email is required.

**Priority**
Critical

**Category**
Validation

---

#### QA-FLOWRA-VAL-004 — Date fields reject invalid dates

**Purpose**
Confirm that date validation works across the form.

**Preconditions**
- User is on a form step with date fields.

**Steps**
1. Enter an invalid date (e.g., February 30).
2. Attempt to proceed or submit.

**Expected Result**
- System rejects the invalid date.
- Error message indicates the date is invalid.

**Priority**
Medium

**Category**
Validation

---

#### QA-FLOWRA-VAL-005 — User cannot submit a negative or zero ID card number

**Purpose**
Confirm that ID card number validation works.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Enter 0 or a negative number for ID card number.
2. Attempt to proceed.

**Expected Result**
- System rejects the invalid ID number.
- Error message indicates a valid positive number is required.

**Priority**
Medium

**Category**
Validation

---

#### QA-FLOWRA-VAL-006 — Lookup fields require valid selections

**Purpose**
Confirm that required lookup fields must have a valid selection.

**Preconditions**
- User is on the Personal form step.

**Steps**
1. Leave a required lookup field (e.g., gender) unselected.
2. Attempt to proceed.

**Expected Result**
- System prevents advancing.
- Error message indicates the field is required.

**Priority**
High

**Category**
Validation

---

#### QA-FLOWRA-VAL-007 — Phone and mobile phone numbers are validated for format

**Purpose**
Confirm that phone number format is checked.

**Preconditions**
- User is on the Product form step.

**Steps**
1. Enter an invalid phone number format.
2. Attempt to proceed.

**Expected Result**
- System may reject the invalid format or accept it depending on validation rules.
- If validated, appropriate error is shown.

**Priority**
Low

**Category**
Validation

---

#### QA-FLOWRA-VAL-008 — Cross-field validation catches inconsistent data

**Purpose**
Confirm that cross-field invariants are checked at submission.

**Preconditions**
- User has filled the form with some inconsistent data.

**Steps**
1. Enter data that violates cross-field rules (e.g., ID expiry before date of birth).
2. Attempt to submit.

**Expected Result**
- System catches the inconsistency.
- Error message explains the validation failure.

**Priority**
Medium

**Category**
Validation

---

## Submission

#### QA-FLOWRA-SUB-001 — User can submit a complete Opening Account application

**Purpose**
Confirm that a fully completed OA can be submitted successfully.

**Preconditions**
- User has CREATE permission for OAs.
- All required fields across all steps are filled correctly.

**Steps**
1. Complete all form steps with valid data.
2. Click Save Opening Account.
3. Observe the result.

**Expected Result**
- Submission succeeds.
- Success toast is displayed.
- User is redirected to the OA list page.
- New OA appears in the list.

**Priority**
Critical

**Category**
Happy Path

---

#### QA-FLOWRA-SUB-002 — User sees an error message when submission fails

**Purpose**
Confirm that submission errors are communicated to the user.

**Preconditions**
- User has a complete OA ready to submit.
- Backend is unavailable or returns an error.

**Steps**
1. Complete all form steps.
2. Attempt to submit.
3. Observe the result.

**Expected Result**
- Error toast is displayed.
- User remains on the form page.
- Draft data is preserved.

**Priority**
High

**Category**
Negative

---

#### QA-FLOWRA-SUB-003 — Submit button is disabled during submission

**Purpose**
Confirm that the submit button prevents double-submission.

**Preconditions**
- User has a complete OA ready to submit.

**Steps**
1. Complete all form steps.
2. Click Save Opening Account.
3. Observe the button state.

**Expected Result**
- Button is disabled while submission is in progress.
- Button re-enables after submission completes (success or failure).

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-SUB-004 — User can edit and resubmit an existing OA

**Purpose**
Confirm that the edit flow allows updating and resubmitting.

**Preconditions**
- An OA exists in the system.
- User has UPDATE permission.

**Steps**
1. Navigate to an existing OA detail page.
2. Click Edit.
3. Modify some fields.
4. Save changes.

**Expected Result**
- Changes are saved successfully.
- Updated OA appears in the list with modified data.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-SUB-005 — User cannot submit an OA without UPDATE permission

**Purpose**
Confirm that submission respects UPDATE permission.

**Preconditions**
- User does not have UPDATE permission for OAs.
- An OA exists in the system.

**Steps**
1. Navigate to an existing OA detail page.
2. Look for the Edit button.

**Expected Result**
- Edit button is not visible.
- User cannot modify or resubmit the OA.

**Priority**
High

**Category**
Permission

---

#### QA-FLOWRA-SUB-006 — User can delete an OA with confirmation

**Purpose**
Confirm that deleting an OA requires confirmation.

**Preconditions**
- User has DELETE permission for OAs.
- An OA exists in the system.

**Steps**
1. Navigate to an OA detail page.
2. Click the Delete button.
3. Confirm the deletion.
4. Observe the result.

**Expected Result**
- Confirmation dialog appears.
- OA is removed from the list after confirmation.
- Deletion is irreversible.

**Priority**
High

**Category**
Happy Path

---

## Detail View

#### QA-FLOWRA-DET-001 — User can view OA detail information

**Purpose**
Confirm that the OA detail page displays all information correctly.

**Preconditions**
- An OA exists in the system.
- User has READ permission.

**Steps**
1. Navigate to the OA list.
2. Click on an OA row.
3. Observe the detail page.

**Expected Result**
- Detail page opens successfully.
- All OA information is displayed in collapsible sections.
- Sections with no data are hidden.

**Priority**
High

**Category**
Happy Path

---

#### QA-FLOWRA-DET-002 — Empty sections are hidden in the detail view

**Purpose**
Confirm that sections with no data are not displayed.

**Preconditions**
- An OA exists with some empty sections.

**Steps**
1. Navigate to an OA detail page.
2. Observe which sections are visible.

**Expected Result**
- Sections with no data are hidden.
- Only sections with data are displayed.

**Priority**
Medium

**Category**
Edge Case

---

#### QA-FLOWRA-DET-003 — User can upload attachments to an OA

**Purpose**
Confirm that attachment upload works on the OA detail page.

**Preconditions**
- User has permission to upload attachments.
- An OA exists in the system.

**Steps**
1. Navigate to an OA detail page.
2. Locate the Attachments section.
3. Upload a file.
4. Observe the result.

**Expected Result**
- File upload succeeds.
- Attachment appears in the list.
- File can be downloaded.

**Priority**
Medium

**Category**
Happy Path

---

#### QA-FLOWRA-DET-004 — User sees a helpful error when OA detail cannot be loaded

**Purpose**
Confirm that detail page handles load failures gracefully.

**Preconditions**
- User has READ permission.
- OA data is unavailable (e.g., backend error).

**Steps**
1. Navigate to an OA detail page.
2. Observe the error state.

**Expected Result**
- Error message is displayed: "Could not load this process".
- Retry and Back to list buttons are available.

**Priority**
Medium

**Category**
Negative

---

#### QA-FLOWRA-DET-005 — Gender is displayed as Male/Female not numeric codes

**Purpose**
Confirm that gender values are rendered correctly.

**Preconditions**
- An OA exists with gender data.

**Steps**
1. Navigate to an OA detail page.
2. Locate the Gender field.
3. Observe the displayed value.

**Expected Result**
- Gender is displayed as "Male" or "Female".
- Numeric codes (1/2) are not shown to the user.

**Priority**
Low

**Category**
Happy Path

---

## Permissions

#### QA-FLOWRA-PERM-001 — User without OA permission cannot access the OA module

**Purpose**
Confirm that users without OA permission are blocked.

**Preconditions**
- User does not have the Opening Account permission.

**Steps**
1. Sign in as a user without OA permission.
2. Attempt to open the Opening Account page.
3. Attempt to open the OA URL directly.

**Expected Result**
- Opening Account is not visible in the sidebar.
- Direct URL access redirects to the dashboard.

**Priority**
High

**Category**
Permission

---

#### QA-FLOWRA-PERM-002 — User without CREATE permission cannot start a new OA

**Purpose**
Confirm that CREATE permission gates the create action.

**Preconditions**
- User has READ but not CREATE permission.

**Steps**
1. Navigate to the OA list.
2. Look for the Create New button.

**Expected Result**
- Create button is not visible.
- User cannot start a new OA.

**Priority**
High

**Category**
Permission

---

#### QA-FLOWRA-PERM-003 — User without UPDATE permission cannot edit an OA

**Purpose**
Confirm that UPDATE permission gates the edit action.

**Preconditions**
- User has READ but not UPDATE permission.
- An OA exists in the system.

**Steps**
1. Navigate to an OA detail page.
2. Look for the Edit button.

**Expected Result**
- Edit button is not visible.
- User cannot modify the OA.

**Priority**
High

**Category**
Permission

---

#### QA-FLOWRA-PERM-004 — User without DELETE permission cannot delete an OA

**Purpose**
Confirm that DELETE permission gates the delete action.

**Preconditions**
- User has READ but not DELETE permission.
- An OA exists in the system.

**Steps**
1. Navigate to an OA detail page.
2. Look for the Delete button.

**Expected Result**
- Delete button is not visible.
- User cannot delete the OA.

**Priority**
High

**Category**
Permission

---

## Coverage Quality Check

- [x] Every major user-facing module covered (all 6 form steps)
- [x] Critical business flows covered (create, validate, submit, edit)
- [x] Important validations covered (required fields, email, dates, lookups)
- [x] Permission-sensitive actions covered
- [x] Draft and autosave behavior covered
- [x] No unnecessary duplication
- [x] All scenarios written in business-readable language
- [x] All expected results are manually observable

## Coverage Gaps

- Other business process modules (Compliance, CSO Process, Purchase, Risk Management, Settlement) are stub implementations and not covered.
- Attachment upload failure scenarios depend on backend behavior.
- Spouse data hydration from backend is a known limitation (spouse form starts empty on edit).

---

Implementation Reference:
`src/routes/_protected/_sales/opening-account/` — OA routes
`src/components/features/opening-account/` — OA components
`src/services/oa/` — OA service layer
`src/lib/draft/` — Draft/autosave hooks
`src/lib/schema/oa-schema.ts` — Validation schemas
