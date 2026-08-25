import { describe, expect, it } from "vitest"

import { normalizeRunFormPayload } from "@/lib/run-form-schema"

const validPayload = {
  name: "Portal Regression",
  applicationId: "21000000-0000-4000-8000-000000000001",
  testPlanId: "0adbe8d1-0779-4eaf-9dfa-464b1a2d20a4",
  releaseId: "22000000-0000-4000-8000-000000000001",
  environmentId: "22000000-0000-4000-8000-000000000003",
  build: "a829d41",
  status: "IN_PROGRESS",
  assignmentProfileIds: ["31000000-0000-4000-8000-000000000003"],
}

describe("normalizeRunFormPayload", () => {
  it("accepts a valid run payload", () => {
    const parsed = normalizeRunFormPayload(validPayload)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.status).toBe("IN_PROGRESS")
    expect(parsed.data.assignmentProfileIds).toHaveLength(1)
  })

  it("rejects missing required relationships and assignees", () => {
    const parsed = normalizeRunFormPayload({
      ...validPayload,
      applicationId: "portal",
      assignmentProfileIds: [],
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const fields = parsed.error.flatten().fieldErrors
    expect(fields.applicationId).toBeTruthy()
    expect(fields.assignmentProfileIds).toBeTruthy()
  })
})
