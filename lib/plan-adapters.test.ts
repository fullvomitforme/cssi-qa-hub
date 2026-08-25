import { describe, expect, it } from "vitest"

import {
  buildDemoPlanSummaries,
  mapPlanDetailRow,
  toPlanFormValues,
} from "@/lib/plan-adapters"

describe("plan adapters", () => {
  it("builds deterministic demo plan summaries from the mock seed", () => {
    const plans = buildDemoPlanSummaries()

    expect(plans.length).toBeGreaterThan(0)
    expect(plans[0]).toMatchObject({
      application: expect.any(String),
      applicationSlug: expect.any(String),
      name: expect.any(String),
      scenarioCount: expect.any(Number),
    })
  })

  it("maps a database plan detail row into the approved UI model", () => {
    const detail = mapPlanDetailRow({
      id: "plan-1",
      name: "Portal v1.10.0 Regression",
      description: "Portal regression scope.",
      start_date: "2026-08-25",
      target_completion: "2026-08-29",
      status: "READY",
      created_at: "2026-08-24T08:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      application_id: "app-1",
      release_id: "rel-1",
      environment_id: "env-1",
      owner_id: "owner-1",
      applications: { name: "Portal", slug: "portal" },
      environments: { name: "UAT" },
      releases: { version: "v1.10.0" },
      owner_profile: { full_name: "QA Lead" },
      created_profile: { full_name: "Admin User" },
      updated_profile: { full_name: "QA Lead" },
      test_plan_items: [
        {
          id: "item-2",
          position: 2,
          test_scenarios: {
            id: "scenario-2",
            title: "Validate lockout",
            priority: "P2",
            test_type: "NEGATIVE",
            applications: { name: "Portal" },
            modules: { name: "Authentication" },
            features: { name: "Login" },
          },
        },
        {
          id: "item-1",
          position: 1,
          test_scenarios: {
            id: "scenario-1",
            title: "Login with valid credentials",
            priority: "P1",
            test_type: "HAPPY_PATH",
            applications: { name: "Portal" },
            modules: { name: "Authentication" },
            features: { name: "Login" },
          },
        },
      ],
      test_plan_assignments: [
        {
          assigned_at: "2026-08-24T09:00:00.000Z",
          profiles: {
            id: "profile-1",
            full_name: "Siti Aisyah",
            email: "siti@example.com",
            role: "QA_TESTER",
          },
        },
      ],
    })

    expect(detail.scenarios.map((scenario) => scenario.id)).toEqual([
      "item-1",
      "item-2",
    ])
    expect(detail.assignments[0]).toMatchObject({
      fullName: "Siti Aisyah",
      role: "QA_TESTER",
    })
    expect(detail.createdBy).toBe("Admin User")
  })

  it("prepares editable form values from persisted plan detail", () => {
    const values = toPlanFormValues({
      id: "plan-1",
      name: "Portal v1.10.0 Regression",
      applicationId: "app-1",
      application: "Portal",
      applicationSlug: "portal",
      releaseId: "rel-1",
      release: "v1.10.0",
      environmentId: "env-1",
      environment: "UAT",
      ownerId: "owner-1",
      owner: "QA Lead",
      description: "Portal regression scope.",
      startDate: "2026-08-25",
      targetCompletion: "2026-08-29",
      targetDate: "2026-08-29",
      scenarioCount: 2,
      progress: null,
      status: "READY",
      createdAt: "2026-08-24T08:00:00.000Z",
      updatedAt: "2026-08-25T08:00:00.000Z",
      createdBy: "Admin User",
      updatedBy: "QA Lead",
      scenarios: [
        {
          id: "item-1",
          scenarioId: "scenario-1",
          title: "Login with valid credentials",
          application: "Portal",
          module: "Authentication",
          feature: "Login",
          priority: "P1",
          type: "HAPPY_PATH",
          position: 1,
        },
      ],
      assignments: [
        {
          profileId: "profile-1",
          fullName: "Siti Aisyah",
          email: "siti@example.com",
          role: "QA_TESTER",
          assignedAt: "2026-08-24T09:00:00.000Z",
        },
      ],
    })

    expect(values).toEqual({
      name: "Portal v1.10.0 Regression",
      applicationId: "app-1",
      releaseId: "rel-1",
      environmentId: "env-1",
      ownerId: "owner-1",
      description: "Portal regression scope.",
      startDate: "2026-08-25",
      targetCompletion: "2026-08-29",
      status: "READY",
      scenarioIds: ["scenario-1"],
      assignmentProfileIds: ["profile-1"],
    })
  })
})
