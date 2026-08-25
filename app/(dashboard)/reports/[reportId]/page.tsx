import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { PrintReportButton } from "@/components/features/reports/print-report-button"
import { ReportApprovalPanel } from "@/components/features/reports/report-approval-panel"
import { ReportPreview } from "@/components/features/reports/report-preview"
import { Button } from "@/components/ui/button"
import { getReportDetail } from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import {
  getReportApprovalState,
  getReportDetailReal,
  getReportPdfUrl,
} from "@/services/reports"
import type { ReportApprovalRecord } from "@/services/reports"
import { getCurrentProfile } from "@/services/auth"
import type { UserRole } from "@/types/qa"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>
}): Promise<Metadata> {
  const { reportId } = await params
  const report = shouldUseDemoData()
    ? getReportDetail(reportId)
    : await getReportDetailReal(reportId)
  return { title: report?.number ?? "QA Report" }
}

export default async function ReportPreviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const report = shouldUseDemoData()
    ? getReportDetail(reportId)
    : await getReportDetailReal(reportId)
  if (!report) notFound()
  const pdfUrl = shouldUseDemoData() ? null : await getReportPdfUrl(reportId)

  let approvals: ReportApprovalRecord[] = []
  let currentRole: UserRole | null = null
  let fallbackPreparedBy = report.preparedBy
  let fallbackReviewedBy = report.reviewedBy
  let fallbackApprovedBy = report.approvedBy

  if (!shouldUseDemoData()) {
    const profile = await getCurrentProfile()
    currentRole = profile?.role ?? null
    approvals = await getReportApprovalState(reportId)
    const prepared = approvals.find((a) => a.kind === "PREPARED_BY")
    const reviewed = approvals.find((a) => a.kind === "REVIEWED_BY")
    const approved = approvals.find((a) => a.kind === "APPROVED_BY")
    if (prepared) fallbackPreparedBy = prepared.approvedBy
    if (reviewed) fallbackReviewedBy = reviewed.approvedBy
    if (approved) fallbackApprovedBy = approved.approvedBy
  }

  return (
    <main className="min-w-0 bg-muted/30 pb-10">
      <div className="report-toolbar sticky top-12 z-10 flex items-center gap-2 border-b bg-background px-4 py-2 lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/reports" />}
          aria-label="Back to reports"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <p className="text-sm font-medium">{report.number}</p>
          <p className="text-xs text-muted-foreground">Final report preview</p>
        </div>
        <div className="ml-auto flex gap-2">
          <PrintReportButton pdfUrl={pdfUrl} />
        </div>
      </div>
      <div className="p-4 lg:p-8">
        <ReportPreview report={report} />
        {approvals.length > 0 || currentRole ? (
          <ReportApprovalPanel
            reportId={reportId}
            approvals={approvals}
            currentRole={currentRole}
            fallbackPreparedBy={fallbackPreparedBy}
            fallbackReviewedBy={fallbackReviewedBy}
            fallbackApprovedBy={fallbackApprovedBy}
          />
        ) : null}
      </div>
    </main>
  )
}
