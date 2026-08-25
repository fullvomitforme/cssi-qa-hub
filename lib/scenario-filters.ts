import { slugifyScenarioOption } from "@/lib/scenario-adapters"
import type { ScenarioSummary } from "@/types/qa"

export type ScenarioFilterValues = {
  search?: string
  application?: string
  module?: string
  feature?: string
  type?: string
  priority?: string
  updated?: "3d" | "7d" | "30d"
}

export function filterScenarios<T extends ScenarioSummary>(
  scenarios: readonly T[],
  filters: ScenarioFilterValues,
  now?: Date
): T[] {
  const needle = filters.search?.trim().toLocaleLowerCase()
  const referenceTime =
    now?.getTime() ??
    Math.max(
      0,
      ...scenarios.map((scenario) => new Date(scenario.updatedAt).getTime())
    )
  const cutoff = filters.updated
    ? referenceTime - Number.parseInt(filters.updated, 10) * 86_400_000
    : null

  return scenarios.filter((scenario) => {
    const matchesSearch =
      !needle ||
      [scenario.title, scenario.description, scenario.module, scenario.feature]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle)

    return (
      matchesSearch &&
      (!filters.application ||
        scenario.applicationSlug === filters.application) &&
      (!filters.module ||
        slugifyScenarioOption(scenario.module) === filters.module) &&
      (!filters.feature ||
        slugifyScenarioOption(scenario.feature) === filters.feature) &&
      (!filters.type || scenario.type === filters.type) &&
      (!filters.priority || scenario.priority === filters.priority) &&
      (cutoff === null || new Date(scenario.updatedAt).getTime() >= cutoff)
    )
  })
}
