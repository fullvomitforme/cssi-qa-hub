import "server-only"

import { members } from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import {
  buildDemoRunDetail,
  buildDemoRunPlanOptions,
  buildDemoRunSummaries,
  mapRunApplicationRow,
  mapRunDetailRow,
  mapRunEnvironmentRow,
  mapRunPlanRow,
  mapRunProfileRow,
  mapRunReleaseRow,
  mapRunSummaryRow,
  type RunApplicationRow,
  type RunDetailRow,
  type RunEnvironmentRow,
  type RunPlanRow,
  type RunProfileRow,
  type RunReleaseRow,
  type RunSummaryRow,
} from "@/lib/run-adapters"
import { createClient } from "@/lib/supabase/server"
import type {
  RunDetail,
  RunFormValues,
  RunQuery,
  RunReferences,
  RunSummary,
} from "@/types/qa"

export class RunMutationError extends Error {
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

export async function listRuns(query: RunQuery): Promise<RunSummary[]> {
  if (shouldUseDemoData()) {
    return buildDemoRunSummaries().filter((run) => {
      const matchesSearch =
        !query.search ||
        `${run.name} ${run.application} ${run.release} ${run.build} ${run.testerLabel}`
          .toLocaleLowerCase()
          .includes(query.search.toLocaleLowerCase())

      return (
        matchesSearch &&
        (!query.application || run.applicationSlug === query.application) &&
        (!query.status || run.status === query.status)
      )
    })
  }

  const supabase = await createClient()
  let request = supabase
    .from("test_runs")
    .select(
      "id,name,test_plan_id,build,status,started_at,completed_at,applications!inner(name,slug),environments!inner(name),releases!inner(version),test_plans!inner(name),test_run_assignments(profiles!inner(full_name)),test_executions(status)"
    )
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (query.status) request = request.eq("status", query.status)

  if (query.application) {
    request = request.eq("applications.slug", query.application)
  }

  if (query.search) {
    const search = `%${query.search}%`
    const [
      { data: matchingApplications, error: applicationSearchError },
      { data: matchingPlans, error: planSearchError },
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("id")
        .ilike("name", search)
        .limit(20),
      supabase.from("test_plans").select("id").ilike("name", search).limit(20),
    ])

    if (applicationSearchError) {
      throw new Error(
        `Unable to search run applications: ${applicationSearchError.message}`
      )
    }
    if (planSearchError) {
      throw new Error(`Unable to search run plans: ${planSearchError.message}`)
    }

    const matchingApplicationIds = (matchingApplications ?? []).map(
      ({ id }) => id
    )
    const matchingPlanIds = (matchingPlans ?? []).map(({ id }) => id)

    const filters = [`name.ilike.${search}`, `build.ilike.${search}`]
    if (matchingApplicationIds.length > 0) {
      filters.push(`application_id.in.(${matchingApplicationIds.join(",")})`)
    }
    if (matchingPlanIds.length > 0) {
      filters.push(`test_plan_id.in.(${matchingPlanIds.join(",")})`)
    }

    request = request.or(filters.join(","))
  }

  const { data, error } = await request
  if (error) throw new Error(`Unable to load test runs: ${error.message}`)

  return (data as unknown as RunSummaryRow[]).map(mapRunSummaryRow)
}

export async function getRun(runId: string): Promise<RunDetail | null> {
  if (shouldUseDemoData()) {
    return buildDemoRunDetail(runId)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_runs")
    .select(
      "id,name,test_plan_id,build,status,started_at,completed_at,application_id,release_id,environment_id,created_at,updated_at,applications!inner(name,slug),environments!inner(name),releases!inner(version),test_plans!inner(name),created_profile:profiles!test_runs_created_by_fkey(full_name),updated_profile:profiles!test_runs_updated_by_fkey(full_name),test_run_assignments(assigned_at,profiles!inner(id,full_name,email,role)),test_executions(id,source_scenario_id,scenario_title,scenario_priority,scenario_type,status)"
    )
    .eq("id", runId)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`Unable to load test run: ${error.message}`)

  return mapRunDetailRow(data as unknown as RunDetailRow)
}

export async function listRunReferences(): Promise<RunReferences> {
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
          build: "a829d41",
          status: "TESTING",
        },
      ],
      planOptions: buildDemoRunPlanOptions(),
      assigneeOptions: members
        .filter((member) => member.status === "ACTIVE")
        .map((member) => ({
          id: `demo-profile-${member.name.toLocaleLowerCase().replaceAll(" ", "-")}`,
          fullName: member.name,
          email: member.email,
          role: member.role,
        })),
    }
  }

  const supabase = await createClient()
  const [applications, environments, releases, plans, assignees] =
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
        .from("test_plans")
        .select(
          "id,name,status,application_id,environment_id,release_id,applications!inner(name),environments!inner(name),releases!inner(version),owner_profile:profiles!test_plans_owner_id_fkey(full_name),test_plan_items(id)"
        )
        .order("updated_at", { ascending: false }),
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
    plans,
    assignees,
  ]) {
    if (result.error) {
      throw new Error(`Unable to load run references: ${result.error.message}`)
    }
  }

  return {
    applications: (applications.data as RunApplicationRow[]).map(
      mapRunApplicationRow
    ),
    environments: (environments.data as RunEnvironmentRow[]).map(
      mapRunEnvironmentRow
    ),
    releases: (releases.data as RunReleaseRow[]).map(mapRunReleaseRow),
    planOptions: ((plans.data ?? []) as unknown as RunPlanRow[]).map(
      mapRunPlanRow
    ),
    assigneeOptions: (assignees.data as RunProfileRow[]).map(mapRunProfileRow),
  }
}

function mapRunMutationError(error: { code?: string; message: string }) {
  if (error.code === "42501") {
    return new RunMutationError(
      "You do not have permission to change test runs.",
      "FORBIDDEN"
    )
  }
  if (error.code === "P0002" || error.code === "PGRST116") {
    return new RunMutationError("Test run not found.", "NOT_FOUND")
  }
  if (
    error.code === "23503" ||
    error.code === "23505" ||
    error.code === "23514"
  ) {
    return new RunMutationError(error.message, "VALIDATION")
  }

  return new RunMutationError(error.message, "UNKNOWN")
}

export async function createRunRecord(values: RunFormValues) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_test_run", {
    target_name: values.name,
    target_test_plan_id: values.testPlanId,
    target_application_id: values.applicationId,
    target_release_id: values.releaseId,
    target_environment_id: values.environmentId,
    target_build: values.build,
    target_status: values.status,
    target_assignment_profile_ids: values.assignmentProfileIds,
  })

  if (error) throw mapRunMutationError(error)
  return data as string
}

export async function updateRunRecord(runId: string, values: RunFormValues) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("update_test_run", {
    target_run_id: runId,
    target_name: values.name,
    target_release_id: values.releaseId,
    target_environment_id: values.environmentId,
    target_build: values.build,
    target_status: values.status,
    target_assignment_profile_ids: values.assignmentProfileIds,
  })

  if (error) throw mapRunMutationError(error)
  return data as string
}
