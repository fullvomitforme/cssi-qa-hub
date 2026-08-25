import { describe, expect, it } from "vitest"

import { normalizePlanFormPayload } from "@/lib/plan-form-schema"

const validPayload = {
  name: "Portal v1.10.0 Regression",
  applicationId: "21000000-0000-4000-8000-000000000001",
  releaseId: "22000000-0000-4000-8000-000000000001",
  environmentId: "20000000-0000-4000-8000-000000000003",
  ownerId: "31000000-0000-4000-8000-000000000002",
  description: "Portal regression plan.",
  startDate: "2026-08-25",
  targetCompletion: "2026-08-29",
  status: "READY",
  scenarioIds: ["25000000-0000-4000-8000-000000000001"],
  assignmentProfileIds: ["31000000-0000-4000-8000-000000000003"],
}

describe("normalizePlanFormPayload", () => {
  it("accepts a valid plan payload", () => {
    const parsed = normalizePlanFormPayload(validPayload)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.status).toBe("READY")
    expect(parsed.data.scenarioIds).toHaveLength(1)
  })

  it("allows optional dates to be blank", () => {
    const parsed = normalizePlanFormPayload({
      ...validPayload,
      startDate: "",
      targetCompletion: "",
    })

    expect(parsed.success).toBe(true)
  })

  it("rejects missing required relationships and selections", () => {
    const parsed = normalizePlanFormPayload({
      ...validPayload,
      applicationId: "portal",
      scenarioIds: [],
      assignmentProfileIds: [],
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const fields = parsed.error.flatten().fieldErrors
    expect(fields.applicationId).toBeTruthy()
    expect(fields.scenarioIds).toBeTruthy()
    expect(fields.assignmentProfileIds).toBeTruthy()
  })

  it("rejects target completion before the start date", () => {
    const parsed = normalizePlanFormPayload({
      ...validPayload,
      startDate: "2026-08-29",
      targetCompletion: "2026-08-25",
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.flatten().fieldErrors.targetCompletion).toBeTruthy()
  })
})
