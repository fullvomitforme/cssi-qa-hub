import "server-only"

import { scenarioSeed } from "@/lib/data/seed"
import { shouldUseDemoData } from "@/lib/env"
import {
  buildDemoPlanSummaries,
  mapPlanApplicationRow,
  mapPlanDetailRow,
  mapPlanEnvironmentRow,
  mapPlanProfileRow,
  mapPlanReleaseRow,
  mapPlanSummaryRow,
  type PlanApplicationRow,
  type PlanDetailRow,
  type PlanEnvironmentRow,
  type PlanProfileRow,
  type PlanReleaseRow,
  type PlanSummaryRow,
} from "@/lib/plan-adapters"
import { createClient } from "@/lib/supabase/server"
import type {
  PlanDetail,
  PlanFormValues,
  PlanQuery,
  PlanReferences,
  PlanSummary,
  ScenarioQuery,
  ScenarioSummary,
} from "@/types/qa"

export class PlanMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION"
      | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

export async function listPlans(query: PlanQuery): Promise<PlanSummary[]> {
  if (shouldUseDemoData()) {
    return buildDemoPlanSummaries().filter((plan) => {
      const matchesSearch =
        !query.search ||
        `${plan.name} ${plan.application}`
          .toLocaleLowerCase()
          .includes(query.search.toLocaleLowerCase())

      return matchesSearch && (!query.status || plan.status === query.status)
    })
  }

  const supabase = await createClient()
  let request = supabase
    .from("test_plans")
    .select(
      "id,name,target_completion,status,applications!inner(name,slug),environments!inner(name),releases!inner(version),owner_profile:profiles!test_plans_owner_id_fkey(full_name),test_plan_items(id)"
    )
    .order("target_completion", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })

  if (query.status) request = request.eq("status", query.status)

  if (query.search) {
    const search = `%${query.search}%`
    const { data: matchingApplications, error: applicationSearchError } =
      await supabase
        .from("applications")
        .select("id")
        .ilike("name", search)
        .limit(20)

    if (applicationSearchError) {
      throw new Error(
        `Unable to search plan applications: ${applicationSearchError.message}`
      )
    }

    const matchingApplicationIds = (matchingApplications ?? []).map(
      ({ id }) => id
    )

    const filters = [`name.ilike.${search}`]
    if (matchingApplicationIds.length > 0) {
      filters.push(`application_id.in.(${matchingApplicationIds.join(",")})`)
    }

    request = request.or(filters.join(","))
  }

  const { data, error } = await request
  if (error) throw new Error(`Unable to load test plans: ${error.message}`)

  return (data as unknown as PlanSummaryRow[]).map(mapPlanSummaryRow)
}

export async function getPlan(planId: string): Promise<PlanDetail | null> {
  if (shouldUseDemoData()) {
    const summary = buildDemoPlanSummaries().find((plan) => plan.id === planId)
    if (!summary) return null

    return {
      ...summary,
      applicationId: `demo-application-${summary.applicationSlug}`,
      releaseId: `demo-release-${summary.applicationSlug}`,
      environmentId: `demo-environment-${summary.environment.toLocaleLowerCase()}`,
      ownerId: `demo-owner-${summary.owner.toLocaleLowerCase().replaceAll(" ", "-")}`,
      description: "",
      startDate: null,
      targetCompletion: summary.targetDate,
      createdAt: new Date("2026-08-20T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-08-25T00:00:00.000Z").toISOString(),
      createdBy: summary.owner,
      updatedBy: summary.owner,
      scenarios: scenarioSeed
        .slice(0, Math.min(summary.scenarioCount, 5))
        .map((scenario, index) => ({
          id: `demo-plan-item-${index + 1}`,
          scenarioId: scenario.id,
          title: scenario.title,
          application: scenario.application,
          module: scenario.module,
          feature: scenario.feature,
          priority: scenario.priority,
          type: scenario.type,
          position: index + 1,
        })),
      assignments: [
        {
          profileId: "demo-assignment-owner",
          fullName: summary.owner,
          email: "demo@localhost.test",
          role: "QA_LEAD",
          assignedAt: new Date("2026-08-20T00:00:00.000Z").toISOString(),
        },
      ],
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_plans")
    .select(
      "id,name,description,start_date,target_completion,status,created_at,updated_at,application_id,release_id,environment_id,owner_id,applications!inner(name,slug),environments!inner(name),releases!inner(version),owner_profile:profiles!test_plans_owner_id_fkey(full_name),created_profile:profiles!test_plans_created_by_fkey(full_name),updated_profile:profiles!test_plans_updated_by_fkey(full_name),test_plan_items(id,position,test_scenarios!inner(id,title,priority,test_type,applications!inner(name),modules!inner(name),features!inner(name))),test_plan_assignments(assigned_at,profile_id,profiles!test_plan_assignments_profile_id_fkey(id,full_name,email,role))"
    )
    .eq("id", planId)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`Unable to load test plan: ${error.message}`)

  return mapPlanDetailRow(data as unknown as PlanDetailRow)
}

export async function listPlanReferences(): Promise<PlanReferences> {
  if (shouldUseDemoData()) {
    return {
      applications: [
        "Portal",
        "CRM",
        "Flowra",
        "Daily Operation",
        "ITQM",
        "Intranet",
      ].map((name) => ({
        id: `demo-${name.toLocaleLowerCase().replaceAll(" ", "-")}`,
        name,
        slug: name.toLocaleLowerCase().replaceAll(" ", "-"),
      })),
      environments: ["UAT", "STAGING"].map((name) => ({
        id: `demo-env-${name.toLocaleLowerCase()}`,
        name,
        slug: name.toLocaleLowerCase(),
      })),
      releases: [
        {
          id: "demo-release-portal-v1-9-0",
          applicationId: "demo-portal",
          environmentId: "demo-env-uat",
          version: "v1.9.0",
          build: null,
          status: "PLANNED",
        },
      ],
      ownerOptions: [
        {
          id: "demo-owner-andi",
          fullName: "Andi Pratama",
          email: "andi@localhost.test",
          role: "QA_LEAD",
        },
      ],
      assigneeOptions: [
        {
          id: "demo-assignee-andi",
          fullName: "Andi Pratama",
          email: "andi@localhost.test",
          role: "QA_LEAD",
        },
        {
          id: "demo-assignee-siti",
          fullName: "Siti Aisyah",
          email: "siti@localhost.test",
          role: "QA_TESTER",
        },
      ],
    }
  }

  const supabase = await createClient()
  const [applications, environments, releases, owners, assignees] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("environments")
        .select("id, name, slug")
        .order("name", { ascending: true }),
      supabase
        .from("releases")
        .select("id, application_id, environment_id, version, build, status")
        .order("release_date", { ascending: false, nullsFirst: false })
        .order("version", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("status", "ACTIVE")
        .in("role", ["ADMIN", "QA_LEAD"])
        .order("full_name", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("status", "ACTIVE")
        .in("role", ["QA_LEAD", "QA_TESTER"])
        .order("full_name", { ascending: true }),
    ])

  for (const result of [
    applications,
    environments,
    releases,
    owners,
    assignees,
  ]) {
    if (result.error) {
      throw new Error(`Unable to load plan references: ${result.error.message}`)
    }
  }

  return {
    applications: (applications.data as PlanApplicationRow[]).map(
      mapPlanApplicationRow
    ),
    environments: (environments.data as PlanEnvironmentRow[]).map(
      mapPlanEnvironmentRow
    ),
    releases: (releases.data as PlanReleaseRow[]).map(mapPlanReleaseRow),
    ownerOptions: (owners.data as PlanProfileRow[]).map(mapPlanProfileRow),
    assigneeOptions: (assignees.data as PlanProfileRow[]).map(
      mapPlanProfileRow
    ),
  }
}

export async function listPlanSelectableScenarios(
  query: ScenarioQuery & { applicationId?: string; limit?: number }
): Promise<ScenarioSummary[]> {
  if (shouldUseDemoData()) {
    return scenarioSeed
      .filter((scenario) => {
        const matchesSearch =
          !query.search ||
          `${scenario.title} ${scenario.description}`.includes(query.search)
        const matchesApplication =
          !query.applicationId ||
          scenario.applicationSlug ===
            query.applicationId.toLocaleLowerCase().replaceAll(" ", "-")

        return (
          matchesSearch &&
          matchesApplication &&
          (!query.module || scenario.moduleSlug === undefined
            ? scenario.module === query.module
            : scenario.moduleSlug === query.module) &&
          (!query.feature || scenario.featureSlug === undefined
            ? scenario.feature === query.feature
            : scenario.featureSlug === query.feature) &&
          (!query.type || scenario.type === query.type) &&
          (!query.priority || scenario.priority === query.priority)
        )
      })
      .slice(0, query.limit ?? 25)
      .map((scenario) => ({
        id: scenario.id,
        application: scenario.application,
        applicationSlug: scenario.applicationSlug,
        module: scenario.module,
        feature: scenario.feature,
        title: scenario.title,
        description: scenario.description,
        priority: scenario.priority,
        type: scenario.type,
        tags: scenario.tags,
        stepCount: scenario.stepCount,
        updatedAt: scenario.updatedAt,
      }))
  }

  const supabase = await createClient()
  let request = supabase
    .from("test_scenarios")
    .select(
      "id,title,description,priority,test_type,updated_at,applications!inner(id,name,slug),modules!inner(name,slug),features!inner(name,slug),scenario_tags(tag),test_steps(id)"
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(query.limit ?? 25)

  if (query.applicationId) {
    request = request.eq("application_id", query.applicationId)
  }
  if (query.search) request = request.textSearch("search_vector", query.search)
  if (query.module) request = request.eq("modules.slug", query.module)
  if (query.feature) request = request.eq("features.slug", query.feature)
  if (query.type) request = request.eq("test_type", query.type)
  if (query.priority) request = request.eq("priority", query.priority)

  const { data, error } = await request
  if (error) {
    throw new Error(`Unable to load selectable scenarios: ${error.message}`)
  }

  return (data as unknown as ScenarioSummaryRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    type: row.test_type,
    updatedAt: row.updated_at,
    application: row.applications?.name ?? "Unknown",
    applicationSlug: row.applications?.slug ?? "unknown",
    module: row.modules?.name ?? "Unknown",
    feature: row.features?.name ?? "Unknown",
    tags: row.scenario_tags.map(({ tag }) => tag),
    stepCount: row.test_steps.length,
  }))
}

type ScenarioSummaryRow = {
  id: string
  title: string
  description: string
  priority: import("@/types/qa").Priority
  test_type: import("@/types/qa").TestType
  updated_at: string
  applications: { name: string; slug: string } | null
  modules: { name: string; slug: string } | null
  features: { name: string; slug: string } | null
  scenario_tags: Array<{ tag: string }>
  test_steps: Array<{ id: string }>
}

function mapPlanMutationError(error: { code?: string; message: string }) {
  if (error.code === "42501") {
    return new PlanMutationError(
      "You do not have permission to change test plans.",
      "FORBIDDEN"
    )
  }
  if (error.code === "P0002" || error.code === "PGRST116") {
    return new PlanMutationError("Test plan not found.", "NOT_FOUND")
  }
  if (
    error.code === "23503" ||
    error.code === "23505" ||
    error.code === "23514"
  ) {
    return new PlanMutationError(error.message, "VALIDATION")
  }

  return new PlanMutationError(error.message, "UNKNOWN")
}

export async function createPlanRecord(values: PlanFormValues) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_test_plan", {
    target_name: values.name,
    target_application_id: values.applicationId,
    target_release_id: values.releaseId,
    target_environment_id: values.environmentId,
    target_owner_id: values.ownerId,
    target_description: values.description,
    target_start_date: values.startDate,
    target_target_completion: values.targetCompletion,
    target_status: values.status,
    target_scenario_ids: values.scenarioIds,
    target_assignment_profile_ids: values.assignmentProfileIds,
  })

  if (error) throw mapPlanMutationError(error)
  return data as string
}

export async function updatePlanRecord(planId: string, values: PlanFormValues) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("update_test_plan", {
    target_plan_id: planId,
    target_name: values.name,
    target_application_id: values.applicationId,
    target_release_id: values.releaseId,
    target_environment_id: values.environmentId,
    target_owner_id: values.ownerId,
    target_description: values.description,
    target_start_date: values.startDate,
    target_target_completion: values.targetCompletion,
    target_status: values.status,
    target_scenario_ids: values.scenarioIds,
    target_assignment_profile_ids: values.assignmentProfileIds,
  })

  if (error) throw mapPlanMutationError(error)
  return data as string
}
