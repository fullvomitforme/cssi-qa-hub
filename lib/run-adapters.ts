import {
  getTestRunDetail,
  members,
  testPlans,
  testRuns,
} from "@/lib/data/product-seed"
import type {
  ExecutionStatus,
  PlanProfileOption,
  PlanReferenceOption,
  PlanReleaseOption,
  Priority,
  RunAssignment,
  RunDetail,
  RunExecutionSummary,
  RunFormValues,
  RunPlanOption,
  RunScenarioSnapshot,
  RunStatus,
  RunSummary,
  TestType,
  UserRole,
} from "@/types/qa"

export interface RunSummaryRow {
  id: string
  name: string
  test_plan_id: string
  build: string
  status: RunStatus
  started_at: string | null
  completed_at: string | null
  applications: { name: string; slug: string } | null
  environments: { name: string } | null
  releases: { version: string } | null
  test_plans: { name: string } | null
  test_run_assignments: Array<{
    profiles: { full_name: string } | null
  }>
  test_executions: Array<{ status: ExecutionStatus }>
}

export interface RunDetailRow {
  id: string
  name: string
  test_plan_id: string
  build: string
  status: RunStatus
  started_at: string | null
  completed_at: string | null
  application_id: string
  release_id: string
  environment_id: string
  created_at: string
  updated_at: string
  applications: { name: string; slug: string }
  environments: { name: string }
  releases: { version: string }
  test_plans: { name: string }
  created_profile: { full_name: string } | null
  updated_profile: { full_name: string } | null
  test_run_assignments: Array<{
    assigned_at: string
    profiles: {
      id: string
      full_name: string
      email: string
      role: UserRole
    } | null
  }>
  test_executions: Array<{
    id: string
    source_scenario_id: string
    scenario_title: string
    scenario_priority: Priority
    scenario_type: TestType
    status: ExecutionStatus
  }>
}

export interface RunApplicationRow {
  id: string
  name: string
  slug: string
}

export interface RunEnvironmentRow {
  id: string
  name: string
  slug: string
}

export interface RunReleaseRow {
  id: string
  application_id: string
  environment_id: string
  version: string
  build: string | null
  status:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
}

export interface RunProfileRow {
  id: string
  full_name: string
  email: string
  role: UserRole
}

export interface RunPlanRow {
  id: string
  name: string
  status: RunStatus | "DRAFT" | "READY" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  application_id: string
  environment_id: string
  release_id: string
  applications: { name: string } | null
  environments: { name: string } | null
  releases: { version: string } | null
  owner_profile: { full_name: string } | null
  test_plan_items: Array<{ id: string }>
}

function calculateRunExecutionSummary(
  statuses: ExecutionStatus[]
): RunExecutionSummary {
  const total = statuses.length
  const passed = statuses.filter((status) => status === "PASS").length
  const failed = statuses.filter((status) => status === "FAIL").length
  const blocked = statuses.filter((status) => status === "BLOCKED").length
  const skipped = statuses.filter((status) => status === "SKIPPED").length
  const notTested = statuses.filter((status) => status === "NOT_TESTED").length
  const executed = total - notTested

  return {
    total,
    executed,
    passed,
    failed,
    blocked,
    skipped,
    notTested,
    coverage: total === 0 ? 0 : Math.round((executed / total) * 100),
    passRate: executed === 0 ? 0 : Math.round((passed / executed) * 100),
  }
}

function formatTesterLabel(names: string[]) {
  if (names.length === 0) return "Unassigned"
  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(", ")
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

function mapRunAssignment(
  item: RunDetailRow["test_run_assignments"][number]
): RunAssignment | null {
  if (!item.profiles) return null

  return {
    profileId: item.profiles.id,
    fullName: item.profiles.full_name,
    email: item.profiles.email,
    role: item.profiles.role,
    assignedAt: item.assigned_at,
  }
}

function mapRunScenarioSnapshot(
  row: RunDetailRow["test_executions"][number]
): RunScenarioSnapshot {
  return {
    id: row.id,
    sourceScenarioId: row.source_scenario_id,
    title: row.scenario_title,
    priority: row.scenario_priority,
    type: row.scenario_type,
    status: row.status,
  }
}

export function mapRunSummaryRow(row: RunSummaryRow): RunSummary {
  const assignmentNames = row.test_run_assignments
    .map((item) => item.profiles?.full_name ?? null)
    .filter((value) => value !== null)
  const statuses = row.test_executions.map((execution) => execution.status)
  const metrics = calculateRunExecutionSummary(statuses)

  return {
    id: row.id,
    name: row.name,
    application: row.applications?.name ?? "Unknown",
    applicationSlug: row.applications?.slug ?? "unknown",
    planId: row.test_plan_id,
    planName: row.test_plans?.name ?? "Unknown plan",
    release: row.releases?.version ?? "Unknown release",
    build: row.build,
    environment: row.environments?.name ?? "Unknown",
    testerLabel: formatTesterLabel(assignmentNames),
    progress: metrics.coverage,
    passRate: metrics.passRate,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

export function mapRunDetailRow(row: RunDetailRow): RunDetail {
  const assignments = row.test_run_assignments
    .map(mapRunAssignment)
    .filter((item) => item !== null)
  const scenarios = row.test_executions.map(mapRunScenarioSnapshot)
  const metrics = calculateRunExecutionSummary(
    row.test_executions.map((execution) => execution.status)
  )

  return {
    id: row.id,
    name: row.name,
    applicationId: row.application_id,
    application: row.applications.name,
    applicationSlug: row.applications.slug,
    planId: row.test_plan_id,
    planName: row.test_plans.name,
    testPlanId: row.test_plan_id,
    releaseId: row.release_id,
    release: row.releases.version,
    build: row.build,
    environmentId: row.environment_id,
    environment: row.environments.name,
    testerLabel: formatTesterLabel(assignments.map((item) => item.fullName)),
    progress: metrics.coverage,
    passRate: metrics.passRate,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_profile?.full_name ?? "Unknown",
    updatedBy: row.updated_profile?.full_name ?? "Unknown",
    assignments,
    scenarios,
    executionSummary: metrics,
  }
}

export function mapRunApplicationRow(
  row: RunApplicationRow
): PlanReferenceOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

export function mapRunEnvironmentRow(
  row: RunEnvironmentRow
): PlanReferenceOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

export function mapRunReleaseRow(row: RunReleaseRow): PlanReleaseOption {
  return {
    id: row.id,
    applicationId: row.application_id,
    environmentId: row.environment_id,
    version: row.version,
    build: row.build,
    status: row.status,
  }
}

export function mapRunProfileRow(row: RunProfileRow): PlanProfileOption {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
  }
}

export function mapRunPlanRow(row: RunPlanRow): RunPlanOption {
  return {
    id: row.id,
    applicationId: row.application_id,
    applicationName: row.applications?.name ?? "Unknown",
    environmentId: row.environment_id,
    environmentName: row.environments?.name ?? "Unknown",
    releaseId: row.release_id,
    releaseVersion: row.releases?.version ?? "Unknown release",
    name: row.name,
    ownerName: row.owner_profile?.full_name ?? "Unknown",
    scenarioCount: row.test_plan_items.length,
    status: row.status as RunPlanOption["status"],
  }
}

export function buildDemoRunSummaries(): RunSummary[] {
  return testRuns.map((run) => ({
    id: run.id,
    name: run.name,
    application: run.application,
    applicationSlug: run.application.toLocaleLowerCase().replaceAll(" ", "-"),
    planId: `demo-plan-${run.application.toLocaleLowerCase().replaceAll(" ", "-")}`,
    planName: `${run.application} Regression Plan`,
    release: run.release,
    build: run.build,
    environment: run.environment,
    testerLabel: run.tester,
    progress: run.progress,
    passRate: run.passRate,
    status: run.status,
    startedAt: run.started,
    completedAt: null,
  }))
}

export function buildDemoRunDetail(runId: string): RunDetail | null {
  const run = getTestRunDetail(runId)
  if (!run) return null
  const applicationSlug = run.application
    .toLocaleLowerCase()
    .replaceAll(" ", "-")

  const executionSummary = calculateRunExecutionSummary(
    run.executions.map((execution) => execution.status)
  )
  const assignedMember = members.find((member) => member.name === run.tester)

  return {
    id: run.id,
    name: run.name,
    applicationId: `demo-app-${applicationSlug}`,
    application: run.application,
    applicationSlug,
    planId: `demo-plan-${applicationSlug}`,
    planName: `${run.application} Regression Plan`,
    testPlanId: `demo-plan-${applicationSlug}`,
    releaseId: `demo-release-${applicationSlug}`,
    release: run.release,
    build: run.build,
    environmentId: `demo-env-${run.environment.toLocaleLowerCase()}`,
    environment: run.environment,
    testerLabel: run.tester,
    progress: run.progress,
    passRate: run.passRate,
    status: run.status,
    startedAt: run.started,
    completedAt: null,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    createdBy: "Demo User",
    updatedBy: "Demo User",
    assignments: assignedMember
      ? [
          {
            profileId: `demo-profile-${assignedMember.name.toLocaleLowerCase().replaceAll(" ", "-")}`,
            fullName: assignedMember.name,
            email: assignedMember.email,
            role: assignedMember.role,
            assignedAt: "2026-08-24T00:00:00.000Z",
          },
        ]
      : [],
    scenarios: run.executions.map((execution) => ({
      id: execution.id,
      sourceScenarioId: `demo-scenario-${execution.id}`,
      title: execution.title,
      priority: execution.severity === "CRITICAL" ? "P0" : "P2",
      type: "REGRESSION",
      status: execution.status,
    })),
    executionSummary,
  }
}

export function buildDemoRunPlanOptions(): RunPlanOption[] {
  return testPlans.map((plan) => ({
    id: `demo-plan-${plan.application.toLocaleLowerCase().replaceAll(" ", "-")}`,
    applicationId: `demo-app-${plan.application.toLocaleLowerCase().replaceAll(" ", "-")}`,
    applicationName: plan.application,
    environmentId: `demo-env-${plan.environment.toLocaleLowerCase()}`,
    environmentName: plan.environment,
    releaseId: `demo-release-${plan.application.toLocaleLowerCase().replaceAll(" ", "-")}`,
    releaseVersion: plan.release,
    name: plan.name,
    ownerName: plan.owner,
    scenarioCount: plan.scenarios,
    status: plan.status,
  }))
}

export function toRunFormValues(run: RunDetail): RunFormValues {
  return {
    name: run.name,
    applicationId: run.applicationId,
    testPlanId: run.testPlanId,
    releaseId: run.releaseId,
    environmentId: run.environmentId,
    build: run.build,
    status: run.status,
    assignmentProfileIds: run.assignments.map(
      (assignment) => assignment.profileId
    ),
  }
}
