import { describe, expect, it } from "vitest"

import { normalizeScenarioFormPayload } from "@/lib/scenario-form-schema"

const validPayload = {
  applicationId: "21000000-0000-4000-8000-000000000001",
  moduleId: "23000000-0000-4000-8000-000000000001",
  featureId: "24000000-0000-4000-8000-000000000001",
  title: "Login with valid credentials",
  description: "Verify the user can sign in successfully.",
  preconditions: "Provisioned user exists.",
  type: "HAPPY_PATH",
  priority: "P1",
  expectedResult: "Overview page opens.",
  steps: [
    {
      instruction: "Open the login page.",
      expectedResult: "Login form is visible.",
    },
  ],
  tags: ["Smoke", " Auth "],
}

describe("normalizeScenarioFormPayload", () => {
  it("normalizes tags and accepts a valid scenario payload", () => {
    const parsed = normalizeScenarioFormPayload(validPayload)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.tags).toEqual(["auth", "smoke"])
    expect(parsed.data.steps).toHaveLength(1)
  })

  it("rejects missing required scenario content", () => {
    const parsed = normalizeScenarioFormPayload({
      ...validPayload,
      title: " ",
      expectedResult: "",
      steps: [],
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const fields = parsed.error.flatten().fieldErrors
    expect(fields.title).toBeTruthy()
    expect(fields.expectedResult).toBeTruthy()
    expect(fields.steps).toBeTruthy()
  })

  it("requires valid uuid hierarchy references", () => {
    const parsed = normalizeScenarioFormPayload({
      ...validPayload,
      applicationId: "portal",
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.flatten().fieldErrors.applicationId).toBeTruthy()
  })
})
