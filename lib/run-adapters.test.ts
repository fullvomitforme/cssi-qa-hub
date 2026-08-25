import { describe, expect, it } from "vitest"

import {
  buildDemoRunDetail,
  buildDemoRunPlanOptions,
  buildDemoRunSummaries,
  mapRunDetailRow,
  toRunFormValues,
} from "@/lib/run-adapters"

describe("run adapters", () => {
  it("builds deterministic demo run summaries", () => {
    const runs = buildDemoRunSummaries()

    expect(runs.length).toBeGreaterThan(0)
    expect(runs[0]).toMatchObject({
      application: expect.any(String),
      name: expect.any(String),
      passRate: expect.any(Number),
      progress: expect.any(Number),
    })
  })

  it("maps a database run detail row into the approved UI model", () => {
    const detail = mapRunDetailRow({
      id: "run-1",
      name: "Portal Regression",
      test_plan_id: "plan-1",
      build: "a829d41",
      status: "IN_PROGRESS",
      started_at: "2026-08-25T08:00:00.000Z",
      completed_at: null,
      application_id: "app-1",
      release_id: "rel-1",
      environment_id: "env-1",
      created_at: "2026-08-25T07:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      applications: { name: "Portal", slug: "portal" },
      environments: { name: "UAT" },
      releases: { version: "v1.10.0" },
      test_plans: { name: "Portal v1.10.0 Regression" },
      created_profile: { full_name: "Admin User" },
      updated_profile: { full_name: "QA Lead" },
      test_run_assignments: [
        {
          assigned_at: "2026-08-25T07:30:00.000Z",
          profiles: {
            id: "profile-1",
            full_name: "Phase 2 Tester",
            email: "tester@example.com",
            role: "QA_TESTER",
          },
        },
      ],
      test_executions: [
        {
          id: "execution-1",
          source_scenario_id: "scenario-1",
          scenario_title: "Login with valid credentials",
          scenario_priority: "P1",
          scenario_type: "HAPPY_PATH",
          status: "PASS",
        },
        {
          id: "execution-2",
          source_scenario_id: "scenario-2",
          scenario_title: "Lock account after failed attempts",
          scenario_priority: "P2",
          scenario_type: "NEGATIVE",
          status: "NOT_TESTED",
        },
      ],
    })

    expect(detail.executionSummary).toEqual({
      total: 2,
      executed: 1,
      passed: 1,
      failed: 0,
      blocked: 0,
      skipped: 0,
      notTested: 1,
      coverage: 50,
      passRate: 100,
    })
    expect(detail.testerLabel).toBe("Phase 2 Tester")
  })

  it("prepares editable run form values from persisted detail", () => {
    const values = toRunFormValues({
      id: "run-1",
      name: "Portal Regression",
      applicationId: "app-1",
      application: "Portal",
      applicationSlug: "portal",
      planId: "plan-1",
      planName: "Portal v1.10.0 Regression",
      testPlanId: "plan-1",
      releaseId: "rel-1",
      release: "v1.10.0",
      build: "a829d41",
      environmentId: "env-1",
      environment: "UAT",
      testerLabel: "Phase 2 Tester",
      progress: 0,
      passRate: 0,
      status: "NOT_STARTED",
      startedAt: null,
      completedAt: null,
      createdAt: "2026-08-25T07:00:00.000Z",
      updatedAt: "2026-08-25T08:00:00.000Z",
      createdBy: "Admin User",
      updatedBy: "QA Lead",
      assignments: [
        {
          profileId: "profile-1",
          fullName: "Phase 2 Tester",
          email: "tester@example.com",
          role: "QA_TESTER",
          assignedAt: "2026-08-25T07:30:00.000Z",
        },
      ],
      scenarios: [],
      executionSummary: {
        total: 0,
        executed: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        skipped: 0,
        notTested: 0,
        coverage: 0,
        passRate: 0,
      },
    })

    expect(values).toEqual({
      name: "Portal Regression",
      applicationId: "app-1",
      testPlanId: "plan-1",
      releaseId: "rel-1",
      environmentId: "env-1",
      build: "a829d41",
      status: "NOT_STARTED",
      assignmentProfileIds: ["profile-1"],
    })
  })

  it("builds demo run detail and plan options", () => {
    expect(buildDemoRunDetail("run-portal-regression")?.name).toBeDefined()
    expect(buildDemoRunPlanOptions().length).toBeGreaterThan(0)
  })
})
