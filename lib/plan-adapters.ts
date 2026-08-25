import { testPlans } from "@/lib/data/product-seed"
import type {
  PlanAssignment,
  PlanDetail,
  PlanFormValues,
  PlanProfileOption,
  PlanReferenceOption,
  PlanReleaseOption,
  PlanScenarioItem,
  PlanStatus,
  PlanSummary,
  Priority,
  TestType,
  UserRole,
} from "@/types/qa"

interface PlanSummaryRow {
  id: string
  name: string
  target_completion: string | null
  status: PlanStatus
  applications: { name: string; slug: string } | null
  environments: { name: string } | null
  releases: { version: string } | null
  owner_profile: { full_name: string } | null
  test_plan_items: Array<{ id: string }>
}

interface PlanDetailRow {
  id: string
  name: string
  description: string
  start_date: string | null
  target_completion: string | null
  status: PlanStatus
  created_at: string
  updated_at: string
  application_id: string
  release_id: string
  environment_id: string
  owner_id: string
  applications: { name: string; slug: string }
  environments: { name: string }
  releases: { version: string }
  owner_profile: { full_name: string }
  created_profile: { full_name: string } | null
  updated_profile: { full_name: string } | null
  test_plan_items: Array<{
    id: string
    position: number
    test_scenarios: {
      id: string
      title: string
      priority: Priority
      test_type: TestType
      applications: { name: string } | null
      modules: { name: string } | null
      features: { name: string } | null
    } | null
  }>
  test_plan_assignments: Array<{
    assigned_at: string
    profiles: {
      id: string
      full_name: string
      email: string
      role: UserRole
    } | null
  }>
}

export interface PlanApplicationRow {
  id: string
  name: string
  slug: string
}

export interface PlanEnvironmentRow {
  id: string
  name: string
  slug: string
}

export interface PlanReleaseRow {
  id: string
  application_id: string
  environment_id: string
  version: string
  build: string | null
  status:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
}

export interface PlanProfileRow {
  id: string
  full_name: string
  email: string
  role: UserRole
}

export function mapPlanSummaryRow(row: PlanSummaryRow): PlanSummary {
  return {
    id: row.id,
    name: row.name,
    application: row.applications?.name ?? "Unknown",
    applicationSlug: row.applications?.slug ?? "unknown",
    release: row.releases?.version ?? "No release",
    environment: row.environments?.name ?? "Unknown",
    owner: row.owner_profile?.full_name ?? "Unknown",
    scenarioCount: row.test_plan_items.length,
    progress: null,
    status: row.status,
    targetDate: row.target_completion,
  }
}

function mapPlanScenarioItem(
  item: PlanDetailRow["test_plan_items"][number]
): PlanScenarioItem | null {
  if (!item.test_scenarios) return null

  return {
    id: item.id,
    scenarioId: item.test_scenarios.id,
    title: item.test_scenarios.title,
    application: item.test_scenarios.applications?.name ?? "Unknown",
    module: item.test_scenarios.modules?.name ?? "Unknown",
    feature: item.test_scenarios.features?.name ?? "Unknown",
    priority: item.test_scenarios.priority,
    type: item.test_scenarios.test_type,
    position: item.position,
  }
}

function mapPlanAssignment(
  item: PlanDetailRow["test_plan_assignments"][number]
): PlanAssignment | null {
  if (!item.profiles) return null

  return {
    profileId: item.profiles.id,
    fullName: item.profiles.full_name,
    email: item.profiles.email,
    role: item.profiles.role,
    assignedAt: item.assigned_at,
  }
}

export function mapPlanDetailRow(row: PlanDetailRow): PlanDetail {
  const scenarios = row.test_plan_items
    .toSorted((left, right) => left.position - right.position)
    .map(mapPlanScenarioItem)
    .filter((item) => item !== null)
  const assignments = row.test_plan_assignments
    .map(mapPlanAssignment)
    .filter((item) => item !== null)

  return {
    id: row.id,
    name: row.name,
    applicationId: row.application_id,
    application: row.applications.name,
    applicationSlug: row.applications.slug,
    releaseId: row.release_id,
    release: row.releases.version,
    environmentId: row.environment_id,
    environment: row.environments.name,
    ownerId: row.owner_id,
    owner: row.owner_profile.full_name,
    description: row.description,
    startDate: row.start_date,
    targetCompletion: row.target_completion,
    targetDate: row.target_completion,
    progress: null,
    status: row.status,
    scenarioCount: scenarios.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_profile?.full_name ?? "Unknown",
    updatedBy: row.updated_profile?.full_name ?? "Unknown",
    scenarios,
    assignments,
  }
}

export function mapPlanApplicationRow(
  row: PlanApplicationRow
): PlanReferenceOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

export function mapPlanEnvironmentRow(
  row: PlanEnvironmentRow
): PlanReferenceOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

export function mapPlanReleaseRow(row: PlanReleaseRow): PlanReleaseOption {
  return {
    id: row.id,
    applicationId: row.application_id,
    environmentId: row.environment_id,
    version: row.version,
    build: row.build,
    status: row.status,
  }
}

export function mapPlanProfileRow(row: PlanProfileRow): PlanProfileOption {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
  }
}

export function buildDemoPlanSummaries(): PlanSummary[] {
  return testPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    application: plan.application,
    applicationSlug: plan.application.toLocaleLowerCase().replaceAll(" ", "-"),
    release: plan.release,
    environment: plan.environment,
    owner: plan.owner,
    scenarioCount: plan.scenarios,
    progress: plan.progress,
    status: plan.status,
    targetDate: plan.targetDate,
  }))
}

export function toPlanFormValues(plan: PlanDetail): PlanFormValues {
  return {
    name: plan.name,
    applicationId: plan.applicationId,
    releaseId: plan.releaseId,
    environmentId: plan.environmentId,
    ownerId: plan.ownerId,
    description: plan.description,
    startDate: plan.startDate ?? "",
    targetCompletion: plan.targetCompletion ?? "",
    status: plan.status,
    scenarioIds: plan.scenarios.map((scenario) => scenario.scenarioId),
    assignmentProfileIds: plan.assignments.map(
      (assignment) => assignment.profileId
    ),
  }
}

export type { PlanDetailRow, PlanSummaryRow }
