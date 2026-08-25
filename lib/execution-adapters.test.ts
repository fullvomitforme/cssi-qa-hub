import { describe, expect, it } from "vitest"

import { mapRunExecutionWorkspaceRow } from "@/lib/execution-adapters"

describe("mapRunExecutionWorkspaceRow", () => {
  it("maps execution attempts, steps, and metrics from real rows", () => {
    const run = mapRunExecutionWorkspaceRow({
      id: "run-1",
      name: "Portal Verification Run",
      status: "IN_PROGRESS",
      build: "build-001",
      started_at: "2026-08-25T08:00:00.000Z",
      completed_at: null,
      applications: {
        name: "Portal",
        slug: "portal",
      },
      environments: {
        name: "UAT",
      },
      releases: {
        version: "v1.10.0",
      },
      test_run_assignments: [
        {
          profiles: {
            full_name: "Phase 2 Tester",
            role: "QA_TESTER",
          },
        },
      ],
      test_executions: [
        {
          id: "execution-1",
          source_scenario_id: "scenario-1",
          scenario_title: "Login with valid credentials",
          scenario_description: "Use a valid username and password.",
          scenario_preconditions: "User exists.",
          scenario_expected_result: "Dashboard loads.",
          scenario_priority: "P1",
          scenario_type: "REGRESSION",
          status: "FAIL",
          actual_result: "Dashboard did not load.",
          failure_reason: "The login redirect looped.",
          severity: "HIGH",
          bug_reference: "PORTAL-101",
          tested_at: "2026-08-25T08:15:00.000Z",
          tested_profile: {
            full_name: "Phase 2 Tester",
          },
          source_scenario: {
            modules: {
              name: "Authentication",
            },
          },
          test_execution_steps: [
            {
              id: "step-2",
              source_step_id: "source-step-2",
              position: 2,
              instruction: "Enter credentials",
              expected_result: "Credentials accepted",
              status: null,
              actual_result: null,
            },
            {
              id: "step-1",
              source_step_id: "source-step-1",
              position: 1,
              instruction: "Open login page",
              expected_result: "Login page loads",
              status: "PASS",
              actual_result: null,
            },
          ],
          test_execution_attempts: [
            {
              id: "attempt-2",
              attempt_number: 2,
              status: "PASS",
              build: "build-002",
              actual_result: "Dashboard loaded.",
              failure_reason: null,
              severity: null,
              bug_reference: null,
              executed_at: "2026-08-25T09:00:00.000Z",
            },
            {
              id: "attempt-1",
              attempt_number: 1,
              status: "FAIL",
              build: "build-001",
              actual_result: "Dashboard did not load.",
              failure_reason: "The login redirect looped.",
              severity: "HIGH",
              bug_reference: "PORTAL-101",
              executed_at: "2026-08-25T08:15:00.000Z",
            },
          ],
        },
        {
          id: "execution-2",
          source_scenario_id: "scenario-2",
          scenario_title: "Reset password",
          scenario_description: "Reset a forgotten password.",
          scenario_preconditions: "Account exists.",
          scenario_expected_result: "Reset email sent.",
          scenario_priority: "P2",
          scenario_type: "VALIDATION",
          status: "NOT_TESTED",
          actual_result: null,
          failure_reason: null,
          severity: null,
          bug_reference: null,
          tested_at: null,
          tested_profile: null,
          source_scenario: null,
          test_execution_steps: [],
          test_execution_attempts: [],
        },
      ],
    })

    expect(run.tester).toBe("Phase 2 Tester")
    expect(run.progress).toBe(50)
    expect(run.passRate).toBe(0)
    expect(run.executions[0]?.module).toBe("Authentication")
    expect(run.executions[0]?.steps.map((step) => step.position)).toEqual([
      1, 2,
    ])
    expect(
      run.executions[0]?.attempts.map((attempt) => attempt.number)
    ).toEqual([1, 2])
    expect(run.executions[1]?.module).toBe("Uncategorized")
  })
})
