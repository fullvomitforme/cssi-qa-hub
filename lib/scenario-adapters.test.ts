import { describe, expect, it } from "vitest"

import {
  buildDemoScenarioHierarchy,
  mapScenarioDetailRow,
  slugifyScenarioOption,
  toScenarioFormValues,
} from "@/lib/scenario-adapters"

describe("scenario adapters", () => {
  it("builds a deterministic demo hierarchy from the mock scenarios", () => {
    const hierarchy = buildDemoScenarioHierarchy()

    expect(hierarchy.applications.map((item) => item.slug)).toContain("portal")
    expect(
      hierarchy.modules.some(
        (item) =>
          item.applicationSlug === "portal" && item.slug === "authentication"
      )
    ).toBe(true)
    expect(
      hierarchy.features.some(
        (item) =>
          item.applicationSlug === "portal" &&
          item.moduleSlug === "authentication" &&
          item.slug === "login"
      )
    ).toBe(true)
  })

  it("maps a database detail row into the approved UI model", () => {
    const detail = mapScenarioDetailRow({
      id: "scenario-1",
      title: "Login with valid credentials",
      description: "Check that a provisioned user can sign in.",
      preconditions: "User account exists.",
      expected_result: "Dashboard is displayed.",
      priority: "P1",
      test_type: "HAPPY_PATH",
      created_at: "2026-08-20T08:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      applications: { id: "app-1", name: "Portal", slug: "portal" },
      modules: { id: "mod-1", name: "Authentication", slug: "authentication" },
      features: { id: "feat-1", name: "Login", slug: "login" },
      scenario_tags: [{ tag: "smoke" }, { tag: "auth" }],
      test_steps: [
        {
          id: "step-2",
          position: 2,
          instruction: "Enter a password.",
          expected_result: "Password is accepted.",
        },
        {
          id: "step-1",
          position: 1,
          instruction: "Enter an email address.",
          expected_result: "Email is accepted.",
        },
      ],
      created_profile: { full_name: "QA Lead" },
      updated_profile: { full_name: "QA Lead" },
    })

    expect(detail.moduleSlug).toBe("authentication")
    expect(detail.featureSlug).toBe("login")
    expect(detail.steps.map((step) => step.id)).toEqual(["step-1", "step-2"])
    expect(detail.createdBy).toBe("QA Lead")
  })

  it("prepares editable form values only when persisted hierarchy ids exist", () => {
    const editable = toScenarioFormValues({
      id: "scenario-1",
      applicationId: "app-1",
      application: "Portal",
      applicationSlug: "portal",
      moduleId: "mod-1",
      module: "Authentication",
      moduleSlug: "authentication",
      featureId: "feat-1",
      feature: "Login",
      featureSlug: "login",
      title: "Login with valid credentials",
      description: "Check login.",
      preconditions: "User exists.",
      expectedResult: "Dashboard opens.",
      priority: "P1",
      type: "HAPPY_PATH",
      tags: ["auth"],
      steps: [
        {
          id: "step-1",
          position: 1,
          instruction: "Enter credentials",
          expectedResult: "Credentials accepted",
        },
      ],
      stepCount: 1,
      createdBy: "Lead",
      updatedBy: "Lead",
      createdAt: "2026-08-20T08:00:00.000Z",
      updatedAt: "2026-08-25T08:00:00.000Z",
    })

    expect(editable).toEqual({
      applicationId: "app-1",
      moduleId: "mod-1",
      featureId: "feat-1",
      title: "Login with valid credentials",
      description: "Check login.",
      preconditions: "User exists.",
      type: "HAPPY_PATH",
      priority: "P1",
      expectedResult: "Dashboard opens.",
      steps: [
        {
          id: "step-1",
          instruction: "Enter credentials",
          expectedResult: "Credentials accepted",
        },
      ],
      tags: ["auth"],
    })
  })

  it("slugifies UI labels for deterministic filter values", () => {
    expect(slugifyScenarioOption("Personal Information")).toBe(
      "personal-information"
    )
  })
})
