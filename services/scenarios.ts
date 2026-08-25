import "server-only"

import { scenarioSeed } from "@/lib/data/seed"
import { shouldUseDemoData } from "@/lib/env"
import {
  buildDemoScenarioHierarchy,
  mapApplicationRow,
  mapFeatureRow,
  mapModuleRow,
  mapScenarioDetailRow,
  mapScenarioSummaryRow,
  type ApplicationRow,
  type FeatureRow,
  type ModuleRow,
  type ScenarioDetailRow,
  type ScenarioSummaryRow,
} from "@/lib/scenario-adapters"
import { filterScenarios } from "@/lib/scenario-filters"
import { createClient } from "@/lib/supabase/server"
import type {
  ScenarioDetail,
  ScenarioFormValues,
  ScenarioHierarchy,
  ScenarioPage,
  ScenarioQuery,
} from "@/types/qa"

export class ScenarioMutationError extends Error {
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

export async function listScenarioHierarchy(): Promise<ScenarioHierarchy> {
  if (shouldUseDemoData()) {
    return buildDemoScenarioHierarchy()
  }

  const supabase = await createClient()
  const [applicationsResult, modulesResult, featuresResult] = await Promise.all(
    [
      supabase
        .from("applications")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("modules")
        .select("id, name, slug, application_id, applications!inner(slug)")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("features")
        .select(
          "id, name, slug, module_id, modules!inner(slug, application_id, applications!inner(slug))"
        )
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]
  )

  if (applicationsResult.error) {
    throw new Error(
      `Unable to load scenario applications: ${applicationsResult.error.message}`
    )
  }
  if (modulesResult.error) {
    throw new Error(
      `Unable to load scenario modules: ${modulesResult.error.message}`
    )
  }
  if (featuresResult.error) {
    throw new Error(
      `Unable to load scenario features: ${featuresResult.error.message}`
    )
  }

  return {
    applications: (applicationsResult.data as ApplicationRow[]).map(
      mapApplicationRow
    ),
    modules: (modulesResult.data as unknown as ModuleRow[]).map(mapModuleRow),
    features: (featuresResult.data as unknown as FeatureRow[]).map(
      mapFeatureRow
    ),
  }
}

export async function listScenarios(
  query: ScenarioQuery
): Promise<ScenarioPage> {
  if (shouldUseDemoData()) {
    const filtered = filterScenarios(scenarioSeed, query)
    const start = (query.page - 1) * query.pageSize
    return {
      items: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  const supabase = await createClient()
  const start = (query.page - 1) * query.pageSize
  let request = supabase
    .from("test_scenarios")
    .select(
      "id,title,description,priority,test_type,updated_at,applications!inner(name,slug),modules!inner(name,slug),features!inner(name,slug),scenario_tags(tag),test_steps(id)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .range(start, start + query.pageSize - 1)

  if (query.search) request = request.textSearch("search_vector", query.search)
  if (query.application) {
    request = request.eq("applications.slug", query.application)
  }
  if (query.module) request = request.eq("modules.slug", query.module)
  if (query.feature) request = request.eq("features.slug", query.feature)
  if (query.type) request = request.eq("test_type", query.type)
  if (query.priority) request = request.eq("priority", query.priority)
  if (query.updated) {
    const updatedAfter = new Date()
    updatedAfter.setUTCDate(
      updatedAfter.getUTCDate() - Number.parseInt(query.updated, 10)
    )
    request = request.gte("updated_at", updatedAfter.toISOString())
  }

  const { data, error, count } = await request
  if (error) throw new Error(`Unable to load scenarios: ${error.message}`)

  return {
    items: (data as unknown as ScenarioSummaryRow[]).map(mapScenarioSummaryRow),
    total: count ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getScenario(id: string): Promise<ScenarioDetail | null> {
  if (shouldUseDemoData()) {
    return scenarioSeed.find((scenario) => scenario.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_scenarios")
    .select(
      "id,title,description,preconditions,expected_result,priority,test_type,created_at,updated_at,applications!inner(id,name,slug),modules!inner(id,name,slug),features!inner(id,name,slug),scenario_tags(tag),test_steps(id,position,instruction,expected_result),created_profile:profiles!test_scenarios_created_by_fkey(full_name),updated_profile:profiles!test_scenarios_updated_by_fkey(full_name)"
    )
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`Unable to load scenario: ${error.message}`)

  return mapScenarioDetailRow(data as unknown as ScenarioDetailRow)
}

function mapMutationError(error: { code?: string; message: string }) {
  if (error.code === "42501") {
    return new ScenarioMutationError(
      "You do not have permission to update test scenarios.",
      "FORBIDDEN"
    )
  }
  if (error.code === "P0002" || error.code === "PGRST116") {
    return new ScenarioMutationError("Scenario not found.", "NOT_FOUND")
  }
  if (
    error.code === "23503" ||
    error.code === "23505" ||
    error.code === "23514"
  ) {
    return new ScenarioMutationError(error.message, "VALIDATION")
  }

  return new ScenarioMutationError(error.message, "UNKNOWN")
}

export async function createScenarioRecord(values: ScenarioFormValues) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_test_scenario", {
    target_application_id: values.applicationId,
    target_module_id: values.moduleId,
    target_feature_id: values.featureId,
    target_title: values.title,
    target_description: values.description,
    target_preconditions: values.preconditions,
    target_test_type: values.type,
    target_priority: values.priority,
    target_expected_result: values.expectedResult,
    target_steps: values.steps.map((step) => ({
      id: step.id,
      instruction: step.instruction,
      expected_result: step.expectedResult,
    })),
    target_tags: values.tags,
  })

  if (error) throw mapMutationError(error)

  return data as string
}

export async function updateScenarioRecord(
  scenarioId: string,
  values: ScenarioFormValues
) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("update_test_scenario", {
    target_scenario_id: scenarioId,
    target_application_id: values.applicationId,
    target_module_id: values.moduleId,
    target_feature_id: values.featureId,
    target_title: values.title,
    target_description: values.description,
    target_preconditions: values.preconditions,
    target_test_type: values.type,
    target_priority: values.priority,
    target_expected_result: values.expectedResult,
    target_steps: values.steps.map((step) => ({
      id: step.id,
      instruction: step.instruction,
      expected_result: step.expectedResult,
    })),
    target_tags: values.tags,
  })

  if (error) throw mapMutationError(error)

  return data as string
}
