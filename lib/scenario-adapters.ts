import { scenarioSeed } from "@/lib/data/seed"
import type {
  Priority,
  ScenarioApplicationOption,
  ScenarioDetail,
  ScenarioFeatureOption,
  ScenarioFormValues,
  ScenarioHierarchy,
  ScenarioModuleOption,
  ScenarioStep,
  ScenarioSummary,
  TestType,
} from "@/types/qa"

interface ScenarioSummaryRow {
  id: string
  title: string
  description: string
  priority: Priority
  test_type: TestType
  updated_at: string
  applications: { name: string; slug: string } | null
  modules: { name: string; slug: string } | null
  features: { name: string; slug: string } | null
  scenario_tags: Array<{ tag: string }>
  test_steps: Array<{ id: string }>
}

interface ScenarioDetailRow {
  id: string
  title: string
  description: string
  preconditions: string
  expected_result: string
  priority: Priority
  test_type: TestType
  created_at: string
  updated_at: string
  applications: { id: string; name: string; slug: string }
  modules: { id: string; name: string; slug: string }
  features: { id: string; name: string; slug: string }
  scenario_tags: Array<{ tag: string }>
  test_steps: Array<{
    id: string
    position: number
    instruction: string
    expected_result: string | null
  }>
  created_profile: { full_name: string } | null
  updated_profile: { full_name: string } | null
}

interface ApplicationRow {
  id: string
  name: string
  slug: string
}

interface ModuleRow {
  id: string
  name: string
  slug: string
  application_id: string
  applications: { slug: string } | null
}

interface FeatureRow {
  id: string
  name: string
  slug: string
  module_id: string
  modules:
    | {
        slug: string
        application_id: string
        applications: { slug: string } | null
      }
    | Array<{
        slug: string
        application_id: string
        applications: { slug: string } | null
      }>
    | null
}

export function slugifyScenarioOption(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toStep(step: ScenarioDetail["steps"][number]): ScenarioStep {
  return {
    id: step.id,
    position: step.position,
    instruction: step.instruction,
    expectedResult: step.expectedResult,
  }
}

export function mapScenarioSummaryRow(
  row: ScenarioSummaryRow
): ScenarioSummary {
  return {
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
  }
}

export function mapScenarioDetailRow(row: ScenarioDetailRow): ScenarioDetail {
  const steps = row.test_steps
    .toSorted((left, right) => left.position - right.position)
    .map((step) => ({
      id: step.id,
      position: step.position,
      instruction: step.instruction,
      expectedResult: step.expected_result ?? undefined,
    }))

  return {
    id: row.id,
    applicationId: row.applications.id,
    application: row.applications.name,
    applicationSlug: row.applications.slug,
    moduleId: row.modules.id,
    module: row.modules.name,
    moduleSlug: row.modules.slug,
    featureId: row.features.id,
    feature: row.features.name,
    featureSlug: row.features.slug,
    title: row.title,
    description: row.description,
    preconditions: row.preconditions,
    expectedResult: row.expected_result,
    priority: row.priority,
    type: row.test_type,
    tags: row.scenario_tags.map(({ tag }) => tag),
    steps,
    stepCount: steps.length,
    createdBy: row.created_profile?.full_name ?? "Unknown",
    updatedBy: row.updated_profile?.full_name ?? "Unknown",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapApplicationRow(
  row: ApplicationRow
): ScenarioApplicationOption {
  return { id: row.id, name: row.name, slug: row.slug }
}

export function mapModuleRow(row: ModuleRow): ScenarioModuleOption {
  return {
    id: row.id,
    applicationId: row.application_id,
    applicationSlug: row.applications?.slug ?? "unknown",
    name: row.name,
    slug: row.slug,
  }
}

export function mapFeatureRow(row: FeatureRow): ScenarioFeatureOption {
  const moduleRow = Array.isArray(row.modules) ? row.modules[0] : row.modules

  return {
    id: row.id,
    applicationId: moduleRow?.application_id ?? "unknown",
    applicationSlug: moduleRow?.applications?.slug ?? "unknown",
    moduleId: row.module_id,
    moduleSlug: moduleRow?.slug ?? "unknown",
    name: row.name,
    slug: row.slug,
  }
}

export function buildDemoScenarioHierarchy(): ScenarioHierarchy {
  const applications = new Map<string, ScenarioApplicationOption>()
  const modules = new Map<string, ScenarioModuleOption>()
  const features = new Map<string, ScenarioFeatureOption>()

  for (const scenario of scenarioSeed) {
    const applicationId = `demo-app-${scenario.applicationSlug}`
    const moduleSlug = slugifyScenarioOption(scenario.module)
    const moduleId = `demo-module-${scenario.applicationSlug}-${moduleSlug}`
    const featureSlug = slugifyScenarioOption(scenario.feature)
    const featureId = `demo-feature-${scenario.applicationSlug}-${moduleSlug}-${featureSlug}`

    applications.set(applicationId, {
      id: applicationId,
      name: scenario.application,
      slug: scenario.applicationSlug,
    })

    modules.set(moduleId, {
      id: moduleId,
      applicationId,
      applicationSlug: scenario.applicationSlug,
      name: scenario.module,
      slug: moduleSlug,
    })

    features.set(featureId, {
      id: featureId,
      applicationId,
      applicationSlug: scenario.applicationSlug,
      moduleId,
      moduleSlug,
      name: scenario.feature,
      slug: featureSlug,
    })
  }

  return {
    applications: Array.from(applications.values()).toSorted((a, b) =>
      a.name.localeCompare(b.name)
    ),
    modules: Array.from(modules.values()).toSorted((a, b) =>
      a.name.localeCompare(b.name)
    ),
    features: Array.from(features.values()).toSorted((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }
}

export function toScenarioFormValues(
  scenario: ScenarioDetail
): ScenarioFormValues | null {
  if (!scenario.applicationId || !scenario.moduleId || !scenario.featureId) {
    return null
  }

  return {
    applicationId: scenario.applicationId,
    moduleId: scenario.moduleId,
    featureId: scenario.featureId,
    title: scenario.title,
    description: scenario.description,
    preconditions: scenario.preconditions,
    type: scenario.type,
    priority: scenario.priority,
    expectedResult: scenario.expectedResult,
    steps: scenario.steps.map(toStep).map((step) => ({
      id: step.id,
      instruction: step.instruction,
      expectedResult: step.expectedResult ?? "",
    })),
    tags: [...scenario.tags],
  }
}

export type {
  ApplicationRow,
  FeatureRow,
  ModuleRow,
  ScenarioDetailRow,
  ScenarioSummaryRow,
}
