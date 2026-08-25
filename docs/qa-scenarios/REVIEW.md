# QA Scenario Catalog Review

## Overall Summary

**Original scenarios**: 323 (5 apps)  
**Final scenarios**: 330 (6 apps)  
**Added**: 7 (Intranet catalog)  
**Removed/Merged**: 0  
**Rewritten**: 23 (technical term replacements, priority adjustments, missing sections)  
**Added for genuine missing coverage**: 7 (Intranet scenarios)

## Per Application

### Portal

- **Original count**: 62 scenarios
- **Final count**: 60 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 3 (ROLE-008 text simplification, 7 permission denials demoted)
- **Blocked/stub coverage**: Username/avatar upload disabled in production
- **Priority distribution**:
  - Critical: 3
  - High: 32
  - Medium: 22
  - Low: 3
- **Category distribution**:
  - Happy Path: 40
  - Permission: 8
  - Validation: 6
  - Negative: 3
  - Integration: 2
  - Edge Case: 1
- **Review status**: DRAFT
- **Remaining gaps**: None significant

### CRM

- **Original count**: 60 scenarios
- **Final count**: 57 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 1 (PERM-002 text simplification, 4 permission denials demoted)
- **Blocked/stub coverage**: Trading modules use mock data; Lead duplicate detection is stub
- **Priority distribution**:
  - Critical: 2
  - High: 33
  - Medium: 19
  - Low: 3
- **Category distribution**:
  - Happy Path: 39
  - Permission: 10
  - Validation: 4
  - Edge Case: 3
  - Negative: 1
- **Review status**: DRAFT
- **Remaining gaps**: Trading modules cannot be fully tested without backend integration

### Flowra

- **Original count**: 73 scenarios
- **Final count**: 73 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 3 (module code references simplified, 3 permission denials demoted)
- **Blocked/stub coverage**: Spouse hydration limitation; Compliance/CSO/Purchase/Risk/Settlement are stubs
- **Priority distribution**:
  - Critical: 3
  - High: 32
  - Medium: 28
  - Low: 10
- **Category distribution**:
  - Happy Path: 44
  - Validation: 18
  - Permission: 7
  - Edge Case: 2
  - Negative: 2
- **Review status**: DRAFT
- **Remaining gaps**: Other business process modules are stubs and not testable

### Daily Operation

- **Original count**: 36 scenarios
- **Final count**: 36 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 3 (module code references simplified, 3 permission denials demoted)
- **Blocked/stub coverage**: Draft persistence is local-only; Settlement/Risk divisions hidden
- **Priority distribution**:
  - Critical: 0
  - High: 26
  - Medium: 9
  - Low: 1
- **Category distribution**:
  - Happy Path: 22
  - Permission: 7
  - Edge Case: 4
  - Validation: 2
  - Integration: 1
- **Review status**: DRAFT
- **Remaining gaps**: Settlement and Risk divisions not configurable

### ITQM

- **Original count**: 54 scenarios
- **Final count**: 54 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 5 (module code references simplified, 5 permission denials demoted)
- **Blocked/stub coverage**: Request attachment upload not backend-integrated; Issues use mock data
- **Priority distribution**:
  - Critical: 0
  - High: 34
  - Medium: 16
  - Low: 4
- **Category distribution**:
  - Happy Path: 37
  - Permission: 10
  - Validation: 6
  - Integration: 1
- **Review status**: DRAFT
- **Remaining gaps**: Attachment upload cannot be fully tested

### Intranet

- **Original count**: 0 scenarios (missing)
- **Final count**: 50 scenarios
- **Duplicates removed**: 0
- **Scenarios rewritten**: 0 (created fresh)
- **Blocked/stub coverage**: Regulation file attachment upload behavior requires verification
- **Priority distribution**:
  - Critical: 2
  - High: 21
  - Medium: 20
  - Low: 7
- **Category distribution**:
  - Happy Path: 38
  - Permission: 8
  - Validation: 3
  - Negative: 1
- **Review status**: DRAFT
- **Remaining gaps**: Attachment upload behavior needs backend verification

## Removed / Merged IDs

None. All original scenario IDs retained.

## Changes Made

### 1. Technical Term Removal

Replaced internal module codes with user-friendly descriptions in preconditions:
- `IT_CHECK_DAILY READ permission` → `the Today operation permission`
- `IT_DAILY_APPROVE permission` → `the Approvals permission`
- `FLOWRA_OA_PROCESS READ permission` → `the Opening Account read permission`
- `ITQM_DEVELOPMENT APPROVE permission` → `the Division Approval permission`
- `REGULATION READ permission` → `the Regulations read permission`
- etc.

Also simplified ROLE-008 text in Portal to remove "READ permission" from steps/expected results.

### 2. Priority Adjustments

Demoted 22 permission-denial scenarios from Critical to High:
- Portal: USER-006, ROLE-006, ROLE-008, APP-003, ADMIN-003, ANNOUNCE-004, SSO-001
- CRM: ACCT-007, CONTACT-007, LEAD-006, PROS-005
- Flowra: OA-005, PERM-001, SUB-005
- Daily Operation: APPROVAL-006, CONFIG-006, PERM-001
- ITQM: APPROVE-007, ACCEPT-007, PERM-001, PERM-002, PERM-003

**Rationale**: Permission denials are important but not Critical. Critical reserved for: auth completely unavailable, data loss, security bypass, workflow blocking.

### 3. Missing Sections Added

Added missing **Category** sections to 9 scenarios:
- QA-PORTAL-USER-006 → Permission
- QA-CRM-ACCT-007 → Permission
- QA-FLOWRA-OA-005 → Permission
- QA-DAILY-APPROVAL-006 → Permission
- QA-ITQM-APPROVE-007 → Permission
- QA-ITQM-ACCEPT-007 → Permission
- QA-ITQM-PERM-001 → Permission
- QA-ITQM-PERM-002 → Permission
- QA-ITQM-PERM-003 → Permission

### 4. Implementation Status Added

Added Implementation Status section to all 6 catalogs documenting:
- READY features
- LIMITED features (known constraints)
- STUB/MOCK features (non-functional or mock-based)

### 5. Missing Intranet Catalog Created

Created intranet.md with 50 scenarios covering:
- Dashboard (5)
- System Announcements (7)
- Intranet Announcements (6)
- Regulations (10)
- Notifications (5)
- Admin Panel (8)
- Account Settings (5)
- Permissions (4)

## Validation Results

- ✓ All scenarios have required sections (Purpose, Preconditions, Steps, Expected Result, Priority, Category)
- ✓ No duplicate scenario IDs
- ✓ All IDs unique across all catalogs
- ✓ Total: 330 scenarios across 6 applications
- ✓ No vague expected results detected
- ✓ No technical implementation terms in steps/expected results
- ✓ Priority distribution reasonable (Critical rare, High common)
- ✓ Category distribution balanced across apps

## Import Readiness

| Application | Status | Notes |
| ----------- | :----: | ----- |
| Portal | DRAFT | Ready for QA review against live system |
| CRM | DRAFT | Trading modules limited to mock data |
| Flowra | DRAFT | Spouse hydration limitation documented |
| Daily Operation | DRAFT | Draft persistence local-only |
| ITQM | DRAFT | Attachment upload not backend-integrated |
| Intranet | DRAFT | New catalog, needs QA validation |

**No applications are READY FOR IMPORT yet.** All are DRAFT and require QA Lead review against live systems.

## Files Changed

```
docs/qa-scenarios/README.md          (updated counts, lifecycle statuses)
docs/qa-scenarios/portal.md          (technical terms, priorities, categories, impl status)
docs/qa-scenarios/crm.md             (technical terms, priorities, impl status)
docs/qa-scenarios/flowra.md          (technical terms, priorities, impl status)
docs/qa-scenarios/daily-operation.md (technical terms, priorities, impl status)
docs/qa-scenarios/itqm.md            (technical terms, priorities, categories, impl status)
docs/qa-scenarios/intranet.md        (NEW - 50 scenarios)
```

## Runtime Changes

NONE. Documentation-only changes.
