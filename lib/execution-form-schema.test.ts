import { describe, expect, it } from "vitest"

import { executionSaveSchema } from "@/lib/execution-form-schema"

describe("executionSaveSchema", () => {
  it("requires failure details when status is FAIL", () => {
    const parsed = executionSaveSchema.safeParse({
      runId: "11111111-1111-4111-8111-111111111111",
      executionId: "22222222-2222-4222-8222-222222222222",
      status: "FAIL",
      actualResult: "",
      failureReason: "",
      severity: null,
      bugReference: "",
      steps: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          status: "PASS",
          actualResult: "",
        },
      ],
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const errors = parsed.error.flatten().fieldErrors
    expect(errors.actualResult).toBeDefined()
    expect(errors.failureReason).toBeDefined()
    expect(errors.severity).toBeDefined()
  })

  it("accepts non-failing execution states without failure metadata", () => {
    const parsed = executionSaveSchema.safeParse({
      runId: "11111111-1111-4111-8111-111111111111",
      executionId: "22222222-2222-4222-8222-222222222222",
      status: "PASS",
      actualResult: "",
      failureReason: "",
      severity: null,
      bugReference: "",
      steps: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          status: "PASS",
          actualResult: "",
        },
      ],
    })

    expect(parsed.success).toBe(true)
  })
})
