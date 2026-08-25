import { describe, expect, it } from "vitest"

import { getReportDetail, getTestRunDetail } from "@/lib/data/product-seed"

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
