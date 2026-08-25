# Database Schema

This document describes the PostgreSQL schema used by CSSI QA Hub.

## Migrations Overview

16 migration files in `supabase/migrations/`, applied in chronological order:

| #   | File                                                           | Description                                           |
| --- | -------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `20260824170405_initial_qa_hub.sql`                            | Base schema: tables, enums, functions, RLS            |
| 2   | `20260825042957_align_qa_hub_contract_and_security.sql`        | RLS tightening, new indexes, `can_access_execution()` |
| 3   | `20260825103000_add_scenario_mutation_functions.sql`           | `create_test_scenario()`, `update_test_scenario()`    |
| 4   | `20260825111500_grant_scenario_child_delete_for_updates.sql`   | Cascade delete for scenario children                  |
| 5   | `20260825133000_add_plan_mutation_functions.sql`               | `create_test_plan()`, `update_test_plan()`            |
| 6   | `20260825143000_grant_plan_child_delete_for_updates.sql`       | Cascade delete for plan children                      |
| 7   | `20260825150000_add_run_mutation_functions.sql`                | Run creation and execution snapshot                   |
| 8   | `20260825150005_grant_run_assignment_delete_for_updates.sql`   | Cascade delete for run assignments                    |
| 9   | `20260825150010_fix_run_execution_step_snapshot_insert.sql`    | Fix execution step insertion                          |
| 10  | `20260825160000_add_execution_mutation_function.sql`           | `record_test_execution()` RPC                         |
| 11  | `20260825160010_fix_execution_mutation_timestamp_variable.sql` | Fix timestamp variable                                |
| 12  | `20260825160020_fix_execution_mutation_attempt_counter.sql`    | Fix attempt counter logic                             |
| 13  | `20260825170000_add_attachment_delete_policy.sql`              | Attachment delete policy                              |
| 14  | `20260825190000_add_report_number_rpc.sql`                     | `next_report_number()` function                       |
| 15  | `20260825200000_add_private_report_storage.sql`                | `qa-reports` bucket and policies                      |
| 16  | `20260825210000_add_overview_filters.sql`                      | Overview dashboard with filters                       |

## Schemas

```sql
create schema if not exists private;
create schema if not exists extensions;  -- for pgcrypto, pg_trgm
```

## Extensions

- `pgcrypto` — UUID generation (`gen_random_uuid()`)
- `pg_trgm` — Full-text search (`to_tsvector('simple', ...)`)

## Enums

| Enum Name            | Values                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa_role`            | `ADMIN`, `QA_LEAD`, `QA_TESTER`                                                                                                              |
| `profile_status`     | `ACTIVE`, `INACTIVE`                                                                                                                         |
| `priority`           | `P0`, `P1`, `P2`, `P3`                                                                                                                       |
| `test_type`          | `HAPPY_PATH`, `VALIDATION`, `NEGATIVE`, `PERMISSION`, `EDGE_CASE`, `INTEGRATION`, `REGRESSION`, `RESPONSIVE`, `ACCESSIBILITY`, `PERFORMANCE` |
| `plan_status`        | `DRAFT`, `READY`, `ACTIVE`, `COMPLETED`, `ARCHIVED`                                                                                          |
| `run_status`         | `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`                                                                            |
| `execution_status`   | `NOT_TESTED`, `PASS`, `FAIL`, `BLOCKED`, `SKIPPED`                                                                                           |
| `step_status`        | `PASS`, `FAIL`, `SKIPPED`                                                                                                                    |
| `work_item_status`   | `BACKLOG`, `READY_TO_TEST`, `IN_TESTING`, `BLOCKED`, `FAILED_NEED_FIX`, `RETEST`, `PASSED`, `DONE`                                           |
| `severity`           | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`                                                                                                          |
| `feedback_type`      | `BUG`, `UX`, `COPY`, `IMPROVEMENT`, `QUESTION`                                                                                               |
| `finding_status`     | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `WONT_FIX` (plus `IN_REVIEW`, `LINKED`, `ANSWERED`, `FIXED` added later)                        |
| `release_status`     | `PLANNED`, `TESTING`, `QA_APPROVED`, `REJECTED`, `RELEASED`, `ARCHIVED`                                                                      |
| `report_result`      | `PASS`, `CONDITIONAL_PASS`, `FAIL`                                                                                                           |
| `report_status`      | `DRAFT`, `FINALIZED`                                                                                                                         |
| `approval_kind`      | `PREPARED_BY`, `REVIEWED_BY`, `APPROVED_BY`                                                                                                  |
| `comment_subject`    | `EXECUTION`, `FAILURE`, `FEEDBACK`, `WORK_ITEM`, `REPORT`                                                                                    |
| `environment_status` | `AVAILABLE`, `MAINTENANCE`, `RESTRICTED`                                                                                                     |
| `retest_status`      | `NOT_REQUIRED`, `AWAITING_FIX`, `READY`, `FAILED_AGAIN`, `PASSED`                                                                            |

## Tables

### Reference Data

#### `profiles`

User identity linked to Auth users.

| Column       | Type           | Constraints                |
| ------------ | -------------- | -------------------------- |
| `id`         | uuid           | PK, references auth.users  |
| `email`      | text           | UNIQUE, NOT NULL           |
| `full_name`  | text           | NOT NULL, check length > 0 |
| `role`       | qa_role        | DEFAULT 'QA_TESTER'        |
| `status`     | profile_status | DEFAULT 'ACTIVE'           |
| `avatar_url` | text           | nullable                   |
| `created_at` | timestamptz    | DEFAULT now()              |
| `updated_at` | timestamptz    | DEFAULT now()              |

#### `applications`

Top-level product containers.

| Column        | Type        | Constraints                 |
| ------------- | ----------- | --------------------------- |
| `id`          | uuid        | PK                          |
| `name`        | text        | UNIQUE, NOT NULL            |
| `slug`        | text        | UNIQUE, lowercase, NOT NULL |
| `description` | text        | DEFAULT ''                  |
| `is_active`   | boolean     | DEFAULT true                |
| `created_by`  | uuid        | FK → profiles               |
| `updated_by`  | uuid        | FK → profiles               |
| `created_at`  | timestamptz |                             |
| `updated_at`  | timestamptz |                             |

#### `modules`

Functional groupings within applications.

| Column           | Type        | Constraints                 |
| ---------------- | ----------- | --------------------------- |
| `id`             | uuid        | PK                          |
| `application_id` | uuid        | FK → applications, NOT NULL |
| `name`           | text        | NOT NULL                    |
| `slug`           | text        | lowercase, NOT NULL         |
| `description`    | text        | DEFAULT ''                  |
| `is_active`      | boolean     | DEFAULT true                |
| `created_by`     | uuid        | FK → profiles               |
| `updated_by`     | uuid        | FK → profiles               |
| `created_at`     | timestamptz |                             |
| `updated_at`     | timestamptz |                             |

UNIQUE: `(application_id, slug)`

#### `features`

Feature areas within modules.

| Column        | Type        | Constraints            |
| ------------- | ----------- | ---------------------- |
| `id`          | uuid        | PK                     |
| `module_id`   | uuid        | FK → modules, NOT NULL |
| `name`        | text        | NOT NULL               |
| `slug`        | text        | lowercase, NOT NULL    |
| `description` | text        | DEFAULT ''             |
| `is_active`   | boolean     | DEFAULT true           |
| `created_by`  | uuid        | FK → profiles          |
| `updated_by`  | uuid        | FK → profiles          |
| `created_at`  | timestamptz |                        |
| `updated_at`  | timestamptz |                        |

UNIQUE: `(module_id, slug)`

#### `environments`

Deployment targets.

| Column            | Type               | Constraints         |
| ----------------- | ------------------ | ------------------- |
| `id`              | uuid               | PK                  |
| `name`            | text               | UNIQUE, NOT NULL    |
| `slug`            | text               | UNIQUE, lowercase   |
| `description`     | text               | DEFAULT ''          |
| `base_url`        | text               | nullable            |
| `availability`    | environment_status | DEFAULT 'AVAILABLE' |
| `last_checked_at` | timestamptz        | nullable            |
| `is_active`       | boolean            | DEFAULT true        |
| `created_by`      | uuid               | FK → profiles       |
| `updated_by`      | uuid               | FK → profiles       |
| `created_at`      | timestamptz        |                     |
| `updated_at`      | timestamptz        |                     |

#### `releases`

Versioned builds.

| Column           | Type           | Constraints                 |
| ---------------- | -------------- | --------------------------- |
| `id`             | uuid           | PK                          |
| `application_id` | uuid           | FK → applications, NOT NULL |
| `environment_id` | uuid           | FK → environments, NOT NULL |
| `version`        | text           | NOT NULL                    |
| `build`          | text           | NOT NULL                    |
| `branch`         | text           | nullable                    |
| `commit_sha`     | text           | nullable                    |
| `release_date`   | date           | nullable                    |
| `status`         | release_status | DEFAULT 'PLANNED'           |
| `created_by`     | uuid           | FK → profiles               |
| `updated_by`     | uuid           | FK → profiles               |
| `created_at`     | timestamptz    |                             |
| `updated_at`     | timestamptz    |                             |

UNIQUE: `(application_id, environment_id, version, build)`

### Test Artifacts

#### `test_scenarios`

Reusable test definitions.

| Column            | Type        | Constraints                     |
| ----------------- | ----------- | ------------------------------- |
| `id`              | uuid        | PK                              |
| `application_id`  | uuid        | FK → applications, NOT NULL     |
| `module_id`       | uuid        | FK → modules, NOT NULL          |
| `feature_id`      | uuid        | FK → features, NOT NULL         |
| `title`           | text        | NOT NULL, check trim length > 0 |
| `description`     | text        | DEFAULT ''                      |
| `preconditions`   | text        | DEFAULT ''                      |
| `test_type`       | test_type   | NOT NULL                        |
| `priority`        | priority    | DEFAULT 'P2'                    |
| `expected_result` | text        | NOT NULL                        |
| `is_active`       | boolean     | DEFAULT true                    |
| `search_vector`   | tsvector    | GENERATED STORED                |
| `created_by`      | uuid        | FK → profiles, NOT NULL         |
| `updated_by`      | uuid        | FK → profiles, NOT NULL         |
| `created_at`      | timestamptz |                                 |
| `updated_at`      | timestamptz |                                 |

INDEXES:

- `test_scenarios_search_idx` on `search_vector` (GIN)
- `test_scenarios_filters_idx` on `(application_id, module_id, feature_id, test_type, priority)` WHERE `is_active`

#### `test_steps`

Ordered steps within a scenario.

| Column            | Type        | Constraints                           |
| ----------------- | ----------- | ------------------------------------- |
| `id`              | uuid        | PK                                    |
| `scenario_id`     | uuid        | FK → test_scenarios CASCADE, NOT NULL |
| `position`        | integer     | CHECK > 0, NOT NULL                   |
| `instruction`     | text        | NOT NULL                              |
| `expected_result` | text        | nullable                              |
| `created_by`      | uuid        | FK → profiles, NOT NULL               |
| `created_at`      | timestamptz |                                       |

UNIQUE: `(scenario_id, position)`

#### `scenario_tags`

Lowercase tags on scenarios.

| Column        | Type        | Constraints                           |
| ------------- | ----------- | ------------------------------------- |
| `scenario_id` | uuid        | FK → test_scenarios CASCADE, NOT NULL |
| `tag`         | text        | CHECK lowercase, length 1-40          |
| `created_by`  | uuid        | FK → profiles, NOT NULL               |
| `created_at`  | timestamptz |                                       |

PK: `(scenario_id, tag)`
INDEX: `scenario_tags_tag_idx` on `tag`

### Plans

#### `test_plans`

Scoped test plans.

| Column              | Type        | Constraints                 |
| ------------------- | ----------- | --------------------------- |
| `id`                | uuid        | PK                          |
| `application_id`    | uuid        | FK → applications, NOT NULL |
| `release_id`        | uuid        | FK → releases, NOT NULL     |
| `environment_id`    | uuid        | FK → environments, NOT NULL |
| `name`              | text        | NOT NULL                    |
| `description`       | text        | DEFAULT ''                  |
| `owner_id`          | uuid        | FK → profiles, NOT NULL     |
| `start_date`        | date        | nullable                    |
| `target_completion` | date        | nullable                    |
| `status`            | plan_status | DEFAULT 'DRAFT'             |
| `created_by`        | uuid        | FK → profiles, NOT NULL     |
| `updated_by`        | uuid        | FK → profiles, NOT NULL     |
| `created_at`        | timestamptz |                             |
| `updated_at`        | timestamptz |                             |

#### `test_plan_items`

Scenario-to-plan mapping.

| Column         | Type        | Constraints                       |
| -------------- | ----------- | --------------------------------- |
| `id`           | uuid        | PK                                |
| `test_plan_id` | uuid        | FK → test_plans CASCADE, NOT NULL |
| `scenario_id`  | uuid        | FK → test_scenarios, NOT NULL     |
| `position`     | integer     | CHECK > 0                         |
| `created_by`   | uuid        | FK → profiles, NOT NULL           |
| `created_at`   | timestamptz |                                   |

UNIQUE: `(test_plan_id, scenario_id)`, `(test_plan_id, position)`

#### `test_plan_assignments`

Tester-to-plan mapping.

| Column         | Type        | Constraints                       |
| -------------- | ----------- | --------------------------------- |
| `test_plan_id` | uuid        | FK → test_plans CASCADE, NOT NULL |
| `profile_id`   | uuid        | FK → profiles, NOT NULL           |
| `assigned_by`  | uuid        | FK → profiles, NOT NULL           |
| `assigned_at`  | timestamptz | DEFAULT now()                     |

PK: `(test_plan_id, profile_id)`

### Runs & Executions

#### `test_runs`

Concrete execution instances.

| Column           | Type        | Constraints                 |
| ---------------- | ----------- | --------------------------- |
| `id`             | uuid        | PK                          |
| `test_plan_id`   | uuid        | FK → test_plans, NOT NULL   |
| `application_id` | uuid        | FK → applications, NOT NULL |
| `release_id`     | uuid        | FK → releases, NOT NULL     |
| `environment_id` | uuid        | FK → environments, NOT NULL |
| `name`           | text        | NOT NULL                    |
| `build`          | text        | NOT NULL                    |
| `status`         | run_status  | DEFAULT 'NOT_STARTED'       |
| `started_at`     | timestamptz | nullable                    |
| `completed_at`   | timestamptz | nullable                    |
| `created_by`     | uuid        | FK → profiles, NOT NULL     |
| `updated_by`     | uuid        | FK → profiles, NOT NULL     |
| `created_at`     | timestamptz |                             |
| `updated_at`     | timestamptz |                             |

INDEX: `runs_filter_idx` on `(application_id, release_id, environment_id, status, created_at desc)`

#### `test_run_assignments`

Tester-to-run mapping.

| Column        | Type        | Constraints                      |
| ------------- | ----------- | -------------------------------- |
| `test_run_id` | uuid        | FK → test_runs CASCADE, NOT NULL |
| `profile_id`  | uuid        | FK → profiles, NOT NULL          |
| `assigned_by` | uuid        | FK → profiles, NOT NULL          |
| `assigned_at` | timestamptz | DEFAULT now()                    |

PK: `(test_run_id, profile_id)`
INDEX: `run_assignments_profile_idx` on `(profile_id, test_run_id)`

#### `test_executions`

One per scenario per run (snapshots scenario at creation).

| Column                     | Type             | Constraints                         |
| -------------------------- | ---------------- | ----------------------------------- |
| `id`                       | uuid             | PK                                  |
| `test_run_id`              | uuid             | FK → test_runs, NOT NULL            |
| `source_scenario_id`       | uuid             | FK → test_scenarios, NOT NULL       |
| `scenario_title`           | text             | NOT NULL (snapshot)                 |
| `scenario_description`     | text             | NOT NULL (snapshot)                 |
| `scenario_preconditions`   | text             | NOT NULL (snapshot)                 |
| `scenario_steps`           | jsonb            | NOT NULL, CHECK is array (snapshot) |
| `scenario_expected_result` | text             | NOT NULL (snapshot)                 |
| `scenario_priority`        | priority         | NOT NULL (snapshot)                 |
| `scenario_type`            | test_type        | NOT NULL (snapshot)                 |
| `status`                   | execution_status | DEFAULT 'NOT_TESTED'                |
| `assigned_to`              | uuid             | FK → profiles                       |
| `actual_result`            | text             | nullable                            |
| `failure_reason`           | text             | nullable                            |
| `severity`                 | severity         | nullable                            |
| `bug_reference`            | text             | nullable                            |
| `tested_by`                | uuid             | FK → profiles                       |
| `tested_at`                | timestamptz      | nullable                            |
| `created_by`               | uuid             | FK → profiles, NOT NULL             |
| `updated_by`               | uuid             | FK → profiles, NOT NULL             |
| `created_at`               | timestamptz      |                                     |
| `updated_at`               | timestamptz      |                                     |

CONSTRAINT: Failed executions require `actual_result`, `failure_reason`, and `severity`
UNIQUE: `(test_run_id, source_scenario_id)`
INDEX: `executions_run_status_idx` on `(test_run_id, status)`

#### `test_execution_steps`

Step results per execution.

| Column            | Type        | Constraints                    |
| ----------------- | ----------- | ------------------------------ |
| `id`              | uuid        | PK                             |
| `execution_id`    | uuid        | FK → test_executions, NOT NULL |
| `source_step_id`  | uuid        | FK → test_steps                |
| `position`        | integer     | CHECK > 0                      |
| `instruction`     | text        | NOT NULL                       |
| `expected_result` | text        | nullable                       |
| `status`          | step_status | nullable                       |
| `actual_result`   | text        | nullable                       |
| `tested_by`       | uuid        | FK → profiles                  |
| `tested_at`       | timestamptz | nullable                       |
| `created_at`      | timestamptz |                                |

UNIQUE: `(execution_id, position)`

#### `test_execution_attempts`

Immutable retest history.

| Column                | Type             | Constraints                     |
| --------------------- | ---------------- | ------------------------------- |
| `id`                  | uuid             | PK                              |
| `execution_id`        | uuid             | FK → test_executions, NOT NULL  |
| `attempt_number`      | integer          | CHECK > 0                       |
| `status`              | execution_status | NOT NULL, CHECK <> 'NOT_TESTED' |
| `build`               | text             | NOT NULL                        |
| `actual_result`       | text             | nullable                        |
| `failure_reason`      | text             | nullable                        |
| `severity`            | severity         | nullable                        |
| `bug_reference`       | text             | nullable                        |
| `executed_by`         | uuid             | FK → profiles, NOT NULL         |
| `executed_at`         | timestamptz      | DEFAULT now()                   |
| `previous_attempt_id` | uuid             | FK → test_execution_attempts    |
| `created_at`          | timestamptz      |                                 |

CONSTRAINT: Failed attempts require detail fields
UNIQUE: `(execution_id, attempt_number)`
INDEX: `execution_attempts_history_idx` on `(execution_id, attempt_number desc)`

### Findings & Feedback

#### `qa_work_items`

Board items.

| Column           | Type             | Constraints                 |
| ---------------- | ---------------- | --------------------------- |
| `id`             | uuid             | PK                          |
| `application_id` | uuid             | FK → applications, NOT NULL |
| `module_id`      | uuid             | FK → modules                |
| `feature_id`     | uuid             | FK → features               |
| `release_id`     | uuid             | FK → releases, NOT NULL     |
| `environment_id` | uuid             | FK → environments, NOT NULL |
| `test_run_id`    | uuid             | FK → test_runs              |
| `title`          | text             | NOT NULL                    |
| `description`    | text             | DEFAULT ''                  |
| `priority`       | priority         | DEFAULT 'P2'                |
| `status`         | work_item_status | DEFAULT 'BACKLOG'           |
| `due_at`         | timestamptz      | nullable                    |
| `created_by`     | uuid             | FK → profiles, NOT NULL     |
| `updated_by`     | uuid             | FK → profiles, NOT NULL     |
| `created_at`     | timestamptz      |                             |
| `updated_at`     | timestamptz      |                             |

INDEX: `work_items_board_idx` on `(release_id, status, priority, due_at)`

#### `qa_work_item_assignments`

| Column         | Type        | Constraints                |
| -------------- | ----------- | -------------------------- |
| `work_item_id` | uuid        | FK → qa_work_items CASCADE |
| `profile_id`   | uuid        | FK → profiles              |
| `assigned_by`  | uuid        | FK → profiles              |
| `assigned_at`  | timestamptz | DEFAULT now()              |

PK: `(work_item_id, profile_id)`
INDEX: `work_assignments_profile_idx` on `(profile_id, work_item_id)`

#### `qa_work_item_history`

Immutable status change log.

| Column           | Type             | Constraints             |
| ---------------- | ---------------- | ----------------------- |
| `id`             | uuid             | PK                      |
| `work_item_id`   | uuid             | FK → qa_work_items      |
| `from_status`    | work_item_status | nullable                |
| `to_status`      | work_item_status | NOT NULL                |
| `reason`         | text             | nullable                |
| `fix_build`      | text             | nullable                |
| `changed_by`     | uuid             | FK → profiles, NOT NULL |
| `changed_at`     | timestamptz      | DEFAULT now()           |
| `previous_value` | jsonb            | nullable                |
| `new_value`      | jsonb            | NOT NULL                |

TRIGGER: `immutable_work_history` — blocks UPDATE/DELETE

INDEX: `work_item_history_idx` on `(work_item_id, changed_at desc)`

#### `failures`

Formal bug reports.

| Column           | Type           | Constraints                    |
| ---------------- | -------------- | ------------------------------ |
| `id`             | uuid           | PK                             |
| `application_id` | uuid           | FK → applications, NOT NULL    |
| `execution_id`   | uuid           | FK → test_executions, NOT NULL |
| `attempt_id`     | uuid           | FK → test_execution_attempts   |
| `severity`       | severity       | NOT NULL                       |
| `status`         | finding_status | DEFAULT 'OPEN'                 |
| `title`          | text           | NOT NULL                       |
| `description`    | text           | NOT NULL                       |
| `bug_reference`  | text           | nullable                       |
| `retest_status`  | retest_status  | nullable                       |
| `created_by`     | uuid           | FK → profiles, NOT NULL        |
| `resolved_by`    | uuid           | FK → profiles                  |
| `resolved_at`    | timestamptz    | nullable                       |
| `created_at`     | timestamptz    |                                |
| `updated_at`     | timestamptz    |                                |

INDEX: `failures_filter_idx` on `(application_id, status, severity, created_at desc)`

#### `feedback`

General feedback on executions.

| Column           | Type           | Constraints                    |
| ---------------- | -------------- | ------------------------------ |
| `id`             | uuid           | PK                             |
| `application_id` | uuid           | FK → applications, NOT NULL    |
| `execution_id`   | uuid           | FK → test_executions, NOT NULL |
| `scenario_id`    | uuid           | FK → test_scenarios, NOT NULL  |
| `feedback_type`  | feedback_type  | NOT NULL                       |
| `title`          | text           | NOT NULL                       |
| `description`    | text           | NOT NULL                       |
| `severity`       | severity       | nullable                       |
| `status`         | finding_status | DEFAULT 'OPEN'                 |
| `created_by`     | uuid           | FK → profiles, NOT NULL        |
| `created_at`     | timestamptz    |                                |

INDEX: `feedback_filter_idx` on `(application_id, status, feedback_type, created_at desc)`

#### `attachments`

Evidence files.

| Column         | Type        | Constraints                    |
| -------------- | ----------- | ------------------------------ |
| `id`           | uuid        | PK                             |
| `execution_id` | uuid        | FK → test_executions, NOT NULL |
| `attempt_id`   | uuid        | FK → test_execution_attempts   |
| `failure_id`   | uuid        | FK → failures                  |
| `feedback_id`  | uuid        | FK → feedback                  |
| `storage_path` | text        | UNIQUE, NOT NULL               |
| `filename`     | text        | NOT NULL                       |
| `mime_type`    | text        | NOT NULL                       |
| `size_bytes`   | bigint      | CHECK > 0 AND <= 50MB          |
| `uploaded_by`  | uuid        | FK → profiles, NOT NULL        |
| `uploaded_at`  | timestamptz | DEFAULT now()                  |

INDEX: `attachments_execution_idx` on `(execution_id, uploaded_at desc)`

#### `comments`

Threaded comments.

| Column         | Type            | Constraints                     |
| -------------- | --------------- | ------------------------------- |
| `id`           | uuid            | PK                              |
| `subject_type` | comment_subject | NOT NULL                        |
| `subject_id`   | uuid            | NOT NULL                        |
| `body`         | text            | NOT NULL, CHECK trim length > 0 |
| `created_by`   | uuid            | FK → profiles, NOT NULL         |
| `created_at`   | timestamptz     |                                 |

INDEX: `comments_subject_idx` on `(subject_type, subject_id, created_at)`

### Reports

#### `reports`

Finalized report summaries.

| Column           | Type          | Constraints                 |
| ---------------- | ------------- | --------------------------- |
| `id`             | uuid          | PK                          |
| `test_run_id`    | uuid          | FK → test_runs, NOT NULL    |
| `application_id` | uuid          | FK → applications, NOT NULL |
| `report_number`  | text          | UNIQUE                      |
| `status`         | report_status | DEFAULT 'DRAFT'             |
| `result`         | report_result | nullable                    |
| `conclusion`     | text          | nullable                    |
| `created_by`     | uuid          | FK → profiles, NOT NULL     |
| `finalized_by`   | uuid          | FK → profiles               |
| `finalized_at`   | timestamptz   | nullable                    |
| `created_at`     | timestamptz   |                             |
| `updated_at`     | timestamptz   |                             |

UNIQUE: `(test_run_id)`

#### `report_number_counters`

Atomic counters for report numbering.

| Column           | Type    | Constraints                 |
| ---------------- | ------- | --------------------------- |
| `application_id` | uuid    | FK → applications, NOT NULL |
| `report_year`    | integer | NOT NULL                    |
| `last_number`    | integer | CHECK >= 0                  |

PK: `(application_id, report_year)`

#### `report_snapshots`

Immutable report state at generation.

| Column             | Type        | Constraints               |
| ------------------ | ----------- | ------------------------- |
| `id`               | uuid        | PK                        |
| `report_id`        | uuid        | UNIQUE FK → reports       |
| `test_run_id`      | uuid        | FK → test_runs, NOT NULL  |
| `report_number`    | text        | UNIQUE, NOT NULL          |
| `snapshot_json`    | jsonb       | NOT NULL, CHECK is object |
| `generated_by`     | uuid        | FK → profiles, NOT NULL   |
| `generated_at`     | timestamptz | DEFAULT now()             |
| `pdf_storage_path` | text        | NOT NULL                  |
| `pdf_sha256`       | text        | CHECK length = 64         |

TRIGGER: `immutable_report_snapshots` — blocks UPDATE/DELETE

INDEX: `report_snapshots_test_run_id_idx` on `(test_run_id)`

#### `report_approvals`

Approval history.

| Column          | Type          | Constraints             |
| --------------- | ------------- | ----------------------- |
| `id`            | uuid          | PK                      |
| `report_id`     | uuid          | FK → reports, NOT NULL  |
| `approval_kind` | approval_kind | NOT NULL                |
| `approved_by`   | uuid          | FK → profiles, NOT NULL |
| `approver_role` | qa_role       | NOT NULL                |
| `approved_at`   | timestamptz   | DEFAULT now()           |
| `remarks`       | text          | nullable                |

UNIQUE: `(report_id, approval_kind)`
TRIGGER: `immutable_report_approvals` — blocks UPDATE/DELETE

INDEX: `report_approvals_approved_by_idx` on `(approved_by)`

### Audit

#### `audit_events`

Activity log.

| Column           | Type        | Constraints             |
| ---------------- | ----------- | ----------------------- |
| `id`             | uuid        | PK                      |
| `actor_id`       | uuid        | FK → profiles, NOT NULL |
| `action`         | text        | NOT NULL                |
| `entity_type`    | text        | NOT NULL                |
| `entity_id`      | uuid        | NOT NULL                |
| `previous_value` | jsonb       | nullable                |
| `new_value`      | jsonb       | nullable                |
| `occurred_at`    | timestamptz | DEFAULT now()           |
| `request_id`     | uuid        | nullable                |

TRIGGER: `immutable_audit_events` — blocks UPDATE/DELETE

INDEX: `audit_entity_idx` on `(entity_type, entity_id, occurred_at desc)`
INDEX: `audit_actor_idx` on `(actor_id, occurred_at desc)`

## Functions

### Private Functions (Security Definer)

```sql
private.current_user_role() → qa_role
  Returns the role of the current authenticated user.

private.has_role(allowed qa_role[]) → boolean
  Checks if current user has any of the allowed roles.

private.can_execute_run(target_run_id uuid) → boolean
  Checks if current user can execute a run (admin/lead OR assigned).

private.can_access_execution(target_execution_id, target_application_id, target_scenario_id) → boolean
  Checks if current user can access a specific execution.

private.guard_profile_role() → trigger
  Prevents non-admins from changing roles.

private.set_updated_at() → trigger
  Sets updated_at = now() on updates.

private.reject_immutable_change() → trigger
  Raises exception on UPDATE/DELETE of immutable tables.
```

### Public Functions

```sql
public.get_overview_dashboard(
  filter_release_id uuid DEFAULT NULL,
  filter_environment_id uuid DEFAULT NULL,
  filter_start_date date DEFAULT NULL,
  filter_end_date date DEFAULT NULL
) → jsonb
  Returns dashboard metrics, application progress, distribution, trend, recent runs, top failures.

public.next_report_number(target_application_id uuid, target_year integer) → text
  Atomically increments counter and returns formatted report number.

public.create_test_scenario(...) → uuid
  Creates scenario with steps and tags (requires ADMIN/QA_LEAD).

public.update_test_scenario(...) → uuid
  Updates scenario while preserving step history.

public.create_test_plan(...) → uuid
  Creates plan with scenarios and assignments (requires ADMIN/QA_LEAD).

public.update_test_plan(...) → uuid
  Updates plan with full replacement of scenarios and assignments.

public.record_test_run(...) → uuid
  Creates run and snapshots executions.

public.record_test_execution(...) → void
  Records execution status and attempts (requires run access).
```

## Triggers

### Updated At Triggers

Auto-set `updated_at` on: `profiles`, `applications`, `modules`, `features`, `environments`, `releases`, `test_scenarios`, `test_steps`, `test_plans`, `test_runs`, `test_executions`, `qa_work_items`, `failures`, `feedback`, `comments`, `reports`

### Immutability Triggers

Block UPDATE/DELETE on:

- `test_execution_attempts`
- `qa_work_item_history`
- `report_snapshots`
- `report_approvals`
- `audit_events`

### Role Guard Trigger

- `profiles_role_guard` on `profiles` UPDATE — only ADMIN can change roles

## RLS Model

### Read Policies

Most tables have a simple read policy:

```sql
create policy <table>_read on <table>
  for select to authenticated using (true);
```

Some use role-based checks:

```sql
create policy profiles_read on profiles
  for select to authenticated
  using ((select private.current_user_role()) is not null);
```

### Write Policies

Written policies enforce role checks:

```sql
create policy scenarios_insert on test_scenarios
  for insert to authenticated
  with check ((select private.has_role(array['ADMIN', 'QA_LEAD'])));
```

Execution-scoped policies:

```sql
create policy executions_update on test_executions
  for update to authenticated
  using ((select private.can_execute_run(test_run_id)))
  with check ((select private.can_execute_run(test_run_id)));
```

## Storage Policies

### qa-evidence Bucket

```sql
create policy evidence_read on storage.objects
  for select to authenticated
  using (bucket_id = 'qa-evidence' and exists(...));

create policy evidence_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qa-evidence' and exists(...));
```

### qa-reports Bucket

```sql
create policy report_pdf_read on storage.objects
  for select to authenticated
  using (bucket_id = 'qa-reports' and (select private.current_user_role()) is not null);

create policy report_pdf_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qa-reports' and (select private.has_role(array['ADMIN', 'QA_LEAD'])));
```

## Indexes

### Search Indexes

- `test_scenarios_search_idx` �� GIN on `search_vector` for full-text search

### Filter Indexes

- `test_scenarios_filters_idx` — `(application_id, module_id, feature_id, test_type, priority)` WHERE `is_active`
- `releases_filter_idx` — `(application_id, environment_id, status, release_date desc)`
- `runs_filter_idx` — `(application_id, release_id, environment_id, status, created_at desc)`
- `executions_run_status_idx` — `(test_run_id, status)`
- `work_items_board_idx` — `(release_id, status, priority, due_at)`
- `failures_filter_idx` — `(application_id, status, severity, created_at desc)`
- `feedback_filter_idx` — `(application_id, status, feedback_type, created_at desc)`

### Foreign Key Indexes

Comprehensive indexes on all FK columns not covered by PKs or UNIQUE constraints.

### Audit Indexes

- `audit_entity_idx` — `(entity_type, entity_id, occurred_at desc)`
- `audit_actor_idx` — `(actor_id, occurred_at desc)`
- `work_item_history_idx` — `(work_item_id, changed_at desc)`
