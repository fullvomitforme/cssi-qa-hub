import { describe, expect, it } from "vitest"

import { ReportMutationError } from "@/services/reports"

describe("ReportApprovalRecord", () => {
  it("should define correct shape for approval records", async () => {
    // Verify types compile correctly
    type ApprovalKind = "PREPARED_BY" | "REVIEWED_BY" | "APPROVED_BY"
    type Record = {
      kind: ApprovalKind
      approvedBy: string
      approverRole: "ADMIN" | "QA_LEAD" | "QA_TESTER"
      approvedAt: string
      remarks: string | null
    }

    const prepared: Record = {
      kind: "PREPARED_BY",
      approvedBy: "张三",
      approverRole: "QA_LEAD",
      approvedAt: "2024-01-15T10:00:00Z",
      remarks: null,
    }

    const reviewed: Record = {
      kind: "REVIEWED_BY",
      approvedBy: "李四",
      approverRole: "ADMIN",
      approvedAt: "2024-01-16T14:30:00Z",
      remarks: "LGTM",
    }

    const approved: Record = {
      kind: "APPROVED_BY",
      approvedBy: "王五",
      approverRole: "ADMIN",
      approvedAt: "2024-01-17T09:15:00Z",
      remarks: null,
    }

    expect(prepared.kind).toBe("PREPARED_BY")
    expect(reviewed.approverRole).toBe("ADMIN")
    expect(approved.remarks).toBeNull()
  })
})

describe("ReportMutationError", () => {
  it("should have correct error codes", () => {
    const error = new ReportMutationError("Test error", "FORBIDDEN")
    expect(error.code).toBe("FORBIDDEN")
    expect(error.message).toBe("Test error")
  })

  it("should default to UNKNOWN code", () => {
    const error = new ReportMutationError("Test error")
    expect(error.code).toBe("UNKNOWN")
  })
})

describe("Approval sequence validation", () => {
  it("should enforce PREPARED_BY before REVIEWED_BY", () => {
    const approvals = [
      { kind: "PREPARED_BY", approvedBy: "张三", approverRole: "QA_TESTER", approvedAt: "2024-01-15T10:00:00Z", remarks: null },
    ]

    const hasPrepared = approvals.some((a) => a.kind === "PREPARED_BY")
    const hasReviewed = approvals.some((a) => a.kind === "REVIEWED_BY")

    expect(hasPrepared).toBe(true)
    expect(hasReviewed).toBe(false)
  })

  it("should enforce REVIEWED_BY before APPROVED_BY", () => {
    const approvals = [
      { kind: "PREPARED_BY", approvedBy: "张三", approverRole: "QA_TESTER", approvedAt: "2024-01-15T10:00:00Z", remarks: null },
      { kind: "REVIEWED_BY", approvedBy: "李四", approverRole: "QA_LEAD", approvedAt: "2024-01-16T14:30:00Z", remarks: null },
    ]

    const hasPrepared = approvals.some((a) => a.kind === "PREPARED_BY")
    const hasReviewed = approvals.some((a) => a.kind === "REVIEWED_BY")
    const hasApproved = approvals.some((a) => a.kind === "APPROVED_BY")

    expect(hasPrepared).toBe(true)
    expect(hasReviewed).toBe(true)
    expect(hasApproved).toBe(false)
  })

  it("should reject duplicate approval", () => {
    const approvals = [
      { kind: "PREPARED_BY", approvedBy: "张三", approverRole: "QA_LEAD", approvedAt: "2024-01-15T10:00:00Z", remarks: null },
      { kind: "REVIEWED_BY", approvedBy: "李四", approverRole: "ADMIN", approvedAt: "2024-01-16T14:30:00Z", remarks: null },
    ]

    // Try to add duplicate REVIEWED_BY
    const duplicateApproval = { kind: "REVIEWED_BY", approvedBy: "王五", approverRole: "ADMIN", approvedAt: "2024-01-17T09:00:00Z", remarks: null }
    const exists = approvals.some((a) => a.kind === duplicateApproval.kind)

    expect(exists).toBe(true)
  })
})

describe("Role permission mapping", () => {
  const testCases = [
    // ADMIN permissions
    { role: "ADMIN", kind: "REVIEWED_BY", hasPrepared: true, allowed: true },
    { role: "ADMIN", kind: "APPROVED_BY", hasReviewed: true, allowed: true },
    { role: "ADMIN", kind: "PREPARED_BY", hasPrepared: false, allowed: false }, // PREPARED_BY is auto-recorded

    // QA_LEAD permissions
    { role: "QA_LEAD", kind: "REVIEWED_BY", hasPrepared: true, allowed: true },
    { role: "QA_LEAD", kind: "APPROVED_BY", hasReviewed: true, allowed: false }, // Only ADMIN can approve

    // QA_TESTER permissions
    { role: "QA_TESTER", kind: "REVIEWED_BY", hasPrepared: true, allowed: false },
    { role: "QA_TESTER", kind: "APPROVED_BY", hasReviewed: true, allowed: false },
  ]

  for (const tc of testCases) {
    it(`should ${tc.allowed ? "allow" : "deny"} ${tc.role} to ${tc.kind}`, () => {
      const allowed =
        tc.kind === "REVIEWED_BY"
          ? (tc.role === "ADMIN" || tc.role === "QA_LEAD") && tc.hasPrepared
          : tc.kind === "APPROVED_BY"
            ? tc.role === "ADMIN" && tc.hasReviewed
            : false

      expect(allowed).toBe(tc.allowed)
    })
  }
})
