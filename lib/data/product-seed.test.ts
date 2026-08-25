import { describe, expect, it } from "vitest"

import {
  failureItems,
  getReportDetail,
  getTestRunDetail,
  testRuns,
} from "@/lib/data/product-seed"
import { calculateExecutionMetrics } from "@/lib/execution-metrics"

describe("getTestRunDetail", () => {
  it("selects the matching mock run and its own executions", () => {
    const portal = getTestRunDetail("run-portal-regression")
    const crm = getTestRunDetail("run-crm-regression")

    expect(portal?.application).toBe("Portal")
    expect(portal?.executions[0].title).toBe("Login with valid credentials")
    expect(crm?.application).toBe("CRM")
    expect(crm?.executions[0].title).toBe("Create a qualified lead")
  })

  it("returns undefined for an unknown run", () => {
    expect(getTestRunDetail("run-does-not-exist")).toBeUndefined()
  })

  it("uses execution data for list metrics", () => {
    for (const run of testRuns) {
      const detail = getTestRunDetail(run.id)
      expect(detail).toBeDefined()
      const metrics = calculateExecutionMetrics(detail!.executions)
      expect(run.progress).toBe(metrics.coverage)
      expect(run.passRate).toBe(metrics.passRate)
    }
  })

  it("maps every finding to an execution with the same bug reference", () => {
    for (const failure of failureItems) {
      const execution = getTestRunDetail(failure.runId)?.executions.find(
        (item) => item.id === failure.executionId
      )
      expect(execution?.bugReference).toBe(failure.bugReference)
    }
  })
})

describe("getReportDetail", () => {
  it("selects report content by report number", () => {
    expect(getReportDetail("QA-CRM-2026-0034")?.application).toBe("CRM")
    expect(getReportDetail("QA-CRM-2026-0034")?.result).toBe("FAIL")
    expect(getReportDetail("QA-PORTAL-2026-0081")?.application).toBe("Portal")
  })

  it("returns undefined for an unknown report", () => {
    expect(getReportDetail("QA-UNKNOWN-1")).toBeUndefined()
  })
})
