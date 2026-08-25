import { describe, expect, it } from "vitest"

import { scenarioSeed } from "@/lib/data/seed"
import { filterScenarios } from "@/lib/scenario-filters"

describe("filterScenarios", () => {
  it("filters by module and feature", () => {
    const result = filterScenarios(scenarioSeed, {
      module: "authentication",
      feature: "login",
    })

    expect(result.map((scenario) => scenario.title)).toEqual([
      "Login with valid credentials",
    ])
  })

  it("filters by a deterministic updated window", () => {
    const result = filterScenarios(
      scenarioSeed,
      { updated: "3d" },
      new Date("2026-08-25T23:59:59.000Z")
    )

    expect(result).toHaveLength(3)
  })

  it("uses the latest mock update as its default reference date", () => {
    expect(filterScenarios(scenarioSeed, { updated: "3d" })).toHaveLength(4)
  })
})
