import type { Metadata } from "next"
import Link from "next/link"
import { FileOutputIcon } from "lucide-react"

import { AppProgressTable } from "@/components/features/overview/app-progress-table"
import { BoardPreview } from "@/components/features/overview/board-preview"
import { QAMetricCard } from "@/components/features/overview/qa-metric-card"
import { QuickActions } from "@/components/features/overview/quick-actions"
import {
  StatusDistributionChart,
  TestingTrendChart,
} from "@/components/features/overview/overview-charts"
import { RecentTestRuns } from "@/components/features/overview/recent-test-runs"
import { TopFailuresTable } from "@/components/features/overview/top-failures-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getOverviewData } from "@/services/overview"
import { shouldUseDemoData } from "@/lib/env"

export const metadata: Metadata = { title: "Overview" }

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    release?: string
    environment?: string
    from?: string
    to?: string
  }>
}) {
  const query = await searchParams
  const data = await getOverviewData({
    releaseId: query.release || undefined,
    environmentId: query.environment || undefined,
    startDate: query.from || undefined,
    endDate: query.to || undefined,
  })
  const demoMode = shouldUseDemoData()

  const allReleases = data.recentRuns
    .map((run: { id: string; name: string }) => run.name)
    .filter((name): name is string => Boolean(name))
  const allEnvironments = data.recentRuns
    .map(
      (run: { id: string; name: string; environment?: string | null }) =>
        run.environment
    )
    .filter((env): env is string => Boolean(env))

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            QA progress across all applications
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2 text-xs">
            <span className="text-muted-foreground">Release</span>
            <select
              aria-label="Release"
              defaultValue={query.release ?? ""}
              title="Filter by release version"
              className="bg-transparent font-medium"
            >
              <option value="">All releases</option>
              {allReleases.map((r: string) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2 text-xs">
            <span className="text-muted-foreground">Environment</span>
            <select
              aria-label="Environment"
              defaultValue={query.environment ?? ""}
              title="Filter by environment"
              className="bg-transparent font-medium"
            >
              <option value="">All environments</option>
              {allEnvironments.map((e: string) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2 text-xs">
            <span className="text-muted-foreground">From</span>
            <Input
              type="date"
              defaultValue={query.from}
              aria-label="Start date"
              title="Filter from date"
              className="h-6 border-0 bg-transparent px-0 shadow-none"
            />
          </label>
          <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2 text-xs">
            <span className="text-muted-foreground">To</span>
            <Input
              type="date"
              defaultValue={query.to}
              aria-label="End date"
              title="Filter to date"
              className="h-6 border-0 bg-transparent px-0 shadow-none"
            />
          </label>
          <Button
            variant="inverse"
            size="sm"
            render={
              <Link
                href={demoMode ? "/reports/QA-PORTAL-2026-0081" : "/reports"}
              />
            }
          >
            <FileOutputIcon data-icon="inline-start" />
            Generate Report
          </Button>
        </div>
      </div>

      <section
        aria-label="QA metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      >
        {data.metrics.map((metric) => (
          <QAMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-12">
        <Card className="min-w-0 xl:col-span-5">
          <CardHeader className="border-b">
            <CardTitle>Progress by Application</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <AppProgressTable applications={data.applications} />
          </CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={data.distribution} />
          </CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-4">
          <CardHeader className="border-b">
            <CardTitle>Testing Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TestingTrendChart data={data.trend} />
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-12">
        <Card className="min-w-0 xl:col-span-9">
          <CardHeader className="border-b">
            <CardTitle>QA Board (Work in Progress)</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <BoardPreview />
          </CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>Recent Test Runs</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RecentTestRuns runs={data.recentRuns} />
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-12">
        <Card className="min-w-0 xl:col-span-9">
          <CardHeader className="border-b">
            <CardTitle>Top Failures</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <TopFailuresTable failures={data.topFailures} />
          </CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <QuickActions />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
