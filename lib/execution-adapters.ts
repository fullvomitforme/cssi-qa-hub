import { calculateExecutionMetrics } from "@/lib/execution-metrics"
import {
  getTestRunDetail,
  type MockExecution,
  type MockRunDetail,
} from "@/lib/data/product-seed"
import type {
  ExecutionAttemptItem,
  ExecutionFeedbackItem,
  ExecutionItem,
  ExecutionStepItem,
  ExecutionWorkspaceRun,
  Priority,
  RunStatus,
  Severity,
  StepStatus,
  TestType,
} from "@/types/qa"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
})

type ExecutionModuleRow = {
  name: string
}

type ExecutionScenarioRow = {
  modules: ExecutionModuleRow | null
}

type ExecutionProfileRow = {
  full_name: string
} | null

type ExecutionStepRow = {
  id: string
  source_step_id: string | null
  position: number
  instruction: string
  expected_result: string | null
  status: StepStatus | null
  actual_result: string | null
}

type ExecutionAttemptRow = {
  id: string
  attempt_number: number
  status: Exclude<ExecutionItem["status"], "NOT_TESTED">
  build: string
  actual_result: string | null
  failure_reason: string | null
  severity: Severity | null
  bug_reference: string | null
  executed_at: string
}

export type RunExecutionWorkspaceRow = {
  id: string
  name: string
  status: RunStatus
  build: string
  started_at: string | null
  completed_at: string | null
  applications: {
    name: string
    slug: string
  }
  environments: {
    name: string
  }
  releases: {
    version: string
  }
  test_run_assignments: Array<{
    profiles: {
      full_name: string
      role: string
    }
  }>
  test_executions: Array<{
    id: string
    source_scenario_id: string
    scenario_title: string
    scenario_description: string
    scenario_preconditions: string
    scenario_expected_result: string
    scenario_priority: Priority
    scenario_type: TestType
    status: ExecutionItem["status"]
    actual_result: string | null
    failure_reason: string | null
    severity: Severity | null
    bug_reference: string | null
    tested_at: string | null
    tested_profile: ExecutionProfileRow
    source_scenario: ExecutionScenarioRow | null
    test_execution_steps: ExecutionStepRow[]
    test_execution_attempts: ExecutionAttemptRow[]
  }>
}

function toStepItem(step: ExecutionStepRow): ExecutionStepItem {
  return {
    id: step.id,
    sourceStepId: step.source_step_id,
    position: step.position,
    instruction: step.instruction,
    expectedResult: step.expected_result ?? "",
    status: step.status,
    actualResult: step.actual_result ?? "",
  }
}

function toAttemptItem(attempt: ExecutionAttemptRow): ExecutionAttemptItem {
  return {
    id: attempt.id,
    number: attempt.attempt_number,
    status: attempt.status,
    build: attempt.build,
    testedAt: formatDateTime(attempt.executed_at),
    actualResult: attempt.actual_result ?? "",
    failureReason: attempt.failure_reason ?? "",
    severity: attempt.severity,
    bugReference: attempt.bug_reference ?? "",
  }
}

function toFeedbackItems(execution: MockExecution): ExecutionFeedbackItem[] {
  return (execution.feedback ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    comment: item.comment,
    author: item.author,
    createdAt: item.createdAt,
  }))
}

function toMockExecutionItem(execution: MockExecution): ExecutionItem {
  return {
    id: execution.id,
    sourceScenarioId: execution.id,
    module: execution.module,
    title: execution.title,
    description: execution.description,
    preconditions: execution.preconditions,
    expectedResult: execution.expectedResult,
    actualResult: execution.actualResult,
    status: execution.status,
    priority: "P2",
    type: "REGRESSION",
    severity: execution.severity,
    failureReason: execution.failureReason,
    bugReference: execution.bugReference,
    tester: execution.tester,
    testedAt: execution.testedAt,
    steps: execution.steps.map((instruction, index) => ({
      id: `${execution.id}-step-${index + 1}`,
      sourceStepId: null,
      position: index + 1,
      instruction,
      expectedResult: "",
      status: execution.status === "PASS" ? "PASS" : null,
      actualResult: "",
    })),
    attempts: (execution.attempts ?? []).map((attempt) => ({
      id: `${execution.id}-attempt-${attempt.number}`,
      number: attempt.number,
      status: attempt.status,
      build: attempt.build,
      testedAt: attempt.testedAt,
      actualResult: execution.actualResult,
      failureReason: execution.failureReason,
      severity: execution.severity,
      bugReference: execution.bugReference,
    })),
    feedback: toFeedbackItems(execution),
  }
}

export function buildDemoExecutionWorkspaceRun(
  runId: string
): ExecutionWorkspaceRun | null {
  const run = getTestRunDetail(runId)
  if (!run) return null

  return buildDemoExecutionWorkspaceFromRun(run)
}

export function buildDemoExecutionWorkspaceFromRun(
  run: MockRunDetail
): ExecutionWorkspaceRun {
  return {
    id: run.id,
    name: run.name,
    application: run.application,
    environment: run.environment,
    release: run.release,
    build: run.build,
    tester: run.tester,
    startedLabel: run.started,
    endDateLabel: run.endDate,
    status: run.status,
    progress: run.progress,
    passRate: run.passRate,
    executions: run.executions.map(toMockExecutionItem),
  }
}

function formatDateTime(value: string | null) {
  if (!value) return ""

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatDateLabel(value: string | null, fallback: string) {
  return value ? dateFormatter.format(new Date(value)) : fallback
}

export function mapRunExecutionWorkspaceRow(
  row: RunExecutionWorkspaceRow
): ExecutionWorkspaceRun {
  const executions = [...row.test_executions]
    .sort((left, right) =>
      left.scenario_title.localeCompare(right.scenario_title, "en", {
        sensitivity: "base",
      })
    )
    .map<ExecutionItem>((execution) => ({
      id: execution.id,
      sourceScenarioId: execution.source_scenario_id,
      module: execution.source_scenario?.modules?.name ?? "Uncategorized",
      title: execution.scenario_title,
      description: execution.scenario_description,
      preconditions: execution.scenario_preconditions,
      expectedResult: execution.scenario_expected_result,
      actualResult: execution.actual_result ?? "",
      status: execution.status,
      priority: execution.scenario_priority,
      type: execution.scenario_type,
      severity: execution.severity,
      failureReason: execution.failure_reason ?? "",
      bugReference: execution.bug_reference ?? "",
      tester: execution.tested_profile?.full_name ?? "Not tested",
      testedAt: execution.tested_at
        ? formatDateTime(execution.tested_at)
        : null,
      steps: [...execution.test_execution_steps]
        .sort((left, right) => left.position - right.position)
        .map(toStepItem),
      attempts: [...execution.test_execution_attempts]
        .sort((left, right) => left.attempt_number - right.attempt_number)
        .map(toAttemptItem),
      feedback: [],
    }))

  const metrics = calculateExecutionMetrics(executions)
  const testerNames = row.test_run_assignments
    .map((assignment) => assignment.profiles.full_name)
    .filter(Boolean)

  return {
    id: row.id,
    name: row.name,
    application: row.applications.name,
    environment: row.environments.name,
    release: row.releases.version,
    build: row.build,
    tester:
      testerNames.length > 0 ? testerNames.join(", ") : "No assigned testers",
    startedLabel: formatDateLabel(row.started_at, "Not started"),
    endDateLabel: formatDateLabel(row.completed_at, "In progress"),
    status: row.status,
    progress: metrics.coverage,
    passRate: metrics.passRate,
    executions,
  }
}
