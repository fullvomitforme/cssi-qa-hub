import type { Metadata } from "next"
import { ReportList } from "@/components/features/reports/report-list"

export const metadata: Metadata = { title: "QA Reports" }
export default function ReportsPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">QA Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review finalized QA test execution artifacts and release conclusions.
        </p>
      </div>
      <ReportList />
    </main>
  )
}
