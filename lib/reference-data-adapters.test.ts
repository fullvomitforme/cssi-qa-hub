import { describe, expect, it } from "vitest"

import {
  mapApplicationRow,
  mapEnvironmentRow,
  mapReleaseRow,
} from "@/lib/reference-data-adapters"

describe("reference data adapters", () => {
  it("maps application activity to the UI shape", () => {
    expect(
      mapApplicationRow({
        name: "Portal",
        slug: "portal",
        is_active: true,
      })
    ).toMatchObject({
      name: "Portal",
      slug: "portal",
      status: "ACTIVE",
      owner: "Unassigned",
      modules: 0,
      features: 0,
      scenarios: 0,
      coverage: 0,
    })
  })

  it("maps environment base_url to url and preserves empty values honestly", () => {
    expect(
      mapEnvironmentRow({
        name: "UAT",
        slug: "uat",
        base_url: null,
        availability: "AVAILABLE",
        last_checked_at: null,
      })
    ).toEqual({
      name: "UAT",
      key: "UAT",
      url: "Not configured",
      applications: 0,
      status: "AVAILABLE",
      lastChecked: "Never",
    })
  })

  it("maps joined release rows and handles missing build metadata", () => {
    expect(
      mapReleaseRow({
        version: "v1.9.0",
        build: null,
        branch: null,
        commit_sha: null,
        release_date: null,
        status: "PLANNED",
        applications: [{ name: "Portal" }],
        environments: [{ name: "UAT" }],
      })
    ).toEqual({
      application: "Portal",
      version: "v1.9.0",
      build: "pending",
      branch: "pending",
      commit: "pending",
      date: "TBD",
      environment: "UAT",
      status: "PLANNED",
    })
  })
})
