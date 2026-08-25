import { describe, expect, it } from "vitest"

import { calculateExecutionMetrics } from "@/lib/execution-metrics"

describe("calculateExecutionMetrics", () => {
  it("derives a mathematically consistent run summary", () => {
    expect(
      calculateExecutionMetrics([
        { status: "PASS" },
        { status: "PASS" },
        { status: "FAIL" },
        { status: "BLOCKED" },
        { status: "SKIPPED" },
        { status: "NOT_TESTED" },
        { status: "NOT_TESTED" },
        { status: "NOT_TESTED" },
      ])
    ).toEqual({
      total: 8,
      passed: 2,
      failed: 1,
      blocked: 1,
      skipped: 1,
      notTested: 3,
      executed: 5,
      coverage: 62.5,
      passRate: 40,
    })
  })

  it("returns zero percentages for an empty run", () => {
    expect(calculateExecutionMetrics([])).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
      notTested: 0,
      executed: 0,
      coverage: 0,
      passRate: 0,
    })
  })
})
