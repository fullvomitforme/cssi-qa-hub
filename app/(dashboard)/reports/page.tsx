import type { Metadata } from "next"
import { ReportList } from "@/components/features/reports/report-list"
import { shouldUseDemoData } from "@/lib/env"
import { listReportRunOptions, listReports } from "@/services/reports"

export const metadata: Metadata = { title: "QA Reports" }
export default async function ReportsPage() {
  const [items, runOptions] = shouldUseDemoData()
    ? [undefined, undefined]
    : await Promise.all([listReports(), listReportRunOptions()])
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">QA Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review finalized QA test execution artifacts and release conclusions.
        </p>
      </div>
      <ReportList
        initialItems={items}
        runOptions={runOptions}
        mode={shouldUseDemoData() ? "demo" : "real"}
      />
    </main>
  )
}
