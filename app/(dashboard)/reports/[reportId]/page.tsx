import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon, PrinterIcon } from "lucide-react"

import { ReportPreview } from "@/components/features/reports/report-preview"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "QA-PORTAL-2026-0081" }
export default function ReportPreviewPage() {
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
          <p className="text-sm font-medium">QA-PORTAL-2026-0081</p>
          <p className="text-xs text-muted-foreground">Final report preview</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon data-icon="inline-start" />
            Print
          </Button>
          <Button size="sm" disabled>
            <DownloadIcon data-icon="inline-start" />
            PDF coming later
          </Button>
        </div>
      </div>
      <div className="p-4 lg:p-8">
        <ReportPreview />
      </div>
    </main>
  )
}
