"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { approveReportAction } from "@/app/actions/reports"
import { Button } from "@/components/ui/button"
import type {
  ReportApprovalKind,
  ReportApprovalRecord,
} from "@/services/reports"
import type { UserRole } from "@/types/qa"

const approvalLabels: Record<ReportApprovalKind, string> = {
  PREPARED_BY: "Prepared By",
  REVIEWED_BY: "Reviewed By",
  APPROVED_BY: "Approved By",
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  QA_LEAD: "QA Lead",
  QA_TESTER: "QA Tester",
}

function canRecordApproval(
  role: UserRole | null,
  kind: ReportApprovalKind,
  approvals: ReportApprovalRecord[]
) {
  if (!role) return false
  const hasPrepared = approvals.some((item) => item.kind === "PREPARED_BY")
  const hasReviewed = approvals.some((item) => item.kind === "REVIEWED_BY")

  if (kind === "PREPARED_BY") return false
  if (kind === "REVIEWED_BY") {
    return hasPrepared && (role === "ADMIN" || role === "QA_LEAD")
  }
  return hasReviewed && role === "ADMIN"
}

export function ReportApprovalPanel({
  reportId,
  approvals,
  currentRole,
  fallbackPreparedBy,
  fallbackReviewedBy,
  fallbackApprovedBy,
}: {
  reportId: string
  approvals: ReportApprovalRecord[]
  currentRole: UserRole | null
  fallbackPreparedBy: string
  fallbackReviewedBy: string
  fallbackApprovedBy: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const approvalMap = new Map(approvals.map((item) => [item.kind, item]))

  return (
    <section className="grid grid-cols-3 divide-x p-8">
      {(
        [
          ["PREPARED_BY", fallbackPreparedBy],
          ["REVIEWED_BY", fallbackReviewedBy],
          ["APPROVED_BY", fallbackApprovedBy],
        ] as const
      ).map(([kind, fallbackValue], index) => {
        const approval = approvalMap.get(kind)
        const actionAllowed = canRecordApproval(currentRole, kind, approvals)

        return (
          <div
            key={kind}
            className={index === 0 ? "pr-6" : index === 1 ? "px-6" : "pl-6"}
          >
            <p className="text-xs text-muted-foreground uppercase">
              {approvalLabels[kind]}
            </p>
            <div className="mt-10 border-t pt-2">
              <p className="text-sm font-medium">
                {approval?.approvedBy ?? fallbackValue}
              </p>
              <p className="text-xs text-muted-foreground">
                {approval
                  ? `${roleLabels[approval.approverRole]} · ${new Date(
                      approval.approvedAt
                    ).toLocaleString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Pending"}
              </p>
              {!approval && actionAllowed ? (
                <Button
                  className="mt-3"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await approveReportAction(reportId, kind)
                      setMessage(
                        result.status === "error"
                          ? (result.message ?? null)
                          : null
                      )
                      if (result.status === "success") router.refresh()
                    })
                  }
                >
                  Record {approvalLabels[kind].replace(" By", "")}
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
      {message ? (
        <p className="col-span-3 mt-4 border border-destructive p-3 text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </section>
  )
}
