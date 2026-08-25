import "server-only"

import { scenarioSeed } from "@/lib/data/seed"
import { env, isSupabaseConfigured } from "@/lib/env"
import { filterScenarios } from "@/lib/scenario-filters"
import { createClient } from "@/lib/supabase/server"
import type {
  Priority,
  ScenarioDetail,
  ScenarioPage,
  ScenarioQuery,
  ScenarioSummary,
  TestType,
} from "@/types/qa"

interface ScenarioRow {
  id: string
  title: string
  description: string
  priority: Priority
  test_type: TestType
  updated_at: string
  applications: { name: string; slug: string } | null
  modules: { name: string } | null
  features: { name: string } | null
  scenario_tags: Array<{ tag: string }>
  test_steps: Array<{ id: string }>
}

export async function listScenarios(
  query: ScenarioQuery
): Promise<ScenarioPage> {
  if (env.demoMode && !isSupabaseConfigured()) {
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
      "id,title,description,priority,test_type,updated_at,applications!inner(name,slug),modules!inner(name),features!inner(name),scenario_tags(tag),test_steps(id)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .range(start, start + query.pageSize - 1)

  if (query.search) request = request.textSearch("search_vector", query.search)
  if (query.application)
    request = request.eq("applications.slug", query.application)
  if (query.type) request = request.eq("test_type", query.type)
  if (query.priority) request = request.eq("priority", query.priority)

  const { data, error, count } = await request
  if (error) throw new Error(`Unable to load scenarios: ${error.message}`)

  const rows = data as unknown as ScenarioRow[]
  const items: ScenarioSummary[] = rows.map((row) => ({
    id: row.id,
    application: row.applications?.name ?? "Unknown",
    applicationSlug: row.applications?.slug ?? "unknown",
    module: row.modules?.name ?? "Unknown",
    feature: row.features?.name ?? "Unknown",
    title: row.title,
    description: row.description,
    priority: row.priority,
    type: row.test_type,
    tags: row.scenario_tags.map(({ tag }) => tag),
    stepCount: row.test_steps.length,
    updatedAt: row.updated_at,
  }))

  return {
    items,
    total: count ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getScenario(id: string): Promise<ScenarioDetail | null> {
  if (env.demoMode && !isSupabaseConfigured()) {
    return scenarioSeed.find((scenario) => scenario.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_scenarios")
    .select(
      "id,title,description,preconditions,expected_result,priority,test_type,created_at,updated_at,applications!inner(name,slug),modules!inner(name),features!inner(name),scenario_tags(tag),test_steps(position,instruction,expected_result),created_profile:profiles!test_scenarios_created_by_fkey(full_name),updated_profile:profiles!test_scenarios_updated_by_fkey(full_name)"
    )
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`Unable to load scenario: ${error.message}`)

  const row = data as unknown as {
    id: string
    title: string
    description: string
    preconditions: string
    expected_result: string
    priority: Priority
    test_type: TestType
    created_at: string
    updated_at: string
    applications: { name: string; slug: string }
    modules: { name: string }
    features: { name: string }
    scenario_tags: Array<{ tag: string }>
    test_steps: Array<{
      position: number
      instruction: string
      expected_result: string | null
    }>
    created_profile: { full_name: string }
    updated_profile: { full_name: string }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    preconditions: row.preconditions,
    expectedResult: row.expected_result,
    priority: row.priority,
    type: row.test_type,
    application: row.applications.name,
    applicationSlug: row.applications.slug,
    module: row.modules.name,
    feature: row.features.name,
    tags: row.scenario_tags.map(({ tag }) => tag),
    steps: row.test_steps
      .toSorted((a, b) => a.position - b.position)
      .map((step) => ({
        position: step.position,
        instruction: step.instruction,
        expectedResult: step.expected_result ?? undefined,
      })),
    stepCount: row.test_steps.length,
    createdBy: row.created_profile.full_name,
    updatedBy: row.updated_profile.full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
