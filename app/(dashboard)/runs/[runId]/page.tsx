import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTestRunDetail } from "@/lib/data/product-seed"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ runId: string }>
}): Promise<Metadata> {
  const { runId } = await params
  const run = getTestRunDetail(runId)
  return { title: run?.name ?? "Test Run" }
}

export default async function RunExecutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>
  searchParams: Promise<{
    execution?: string | string[]
    history?: string | string[]
  }>
}) {
  const [{ runId }, query] = await Promise.all([params, searchParams])
  const run = getTestRunDetail(runId)
  if (!run) notFound()

  const executionId =
    typeof query.execution === "string" ? query.execution : undefined
  const showHistory = query.history === "true"

  return (
    <main className="min-w-0">
      <div className="flex flex-wrap items-start gap-3 border-b px-4 py-3 lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/runs" />}
          aria-label="Back to test runs"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{run.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{run.environment}</Badge>
            <span>
              Build{" "}
              <span className="font-mono text-foreground">{run.build}</span>
            </span>
            <span>Release {run.release}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="size-3" />
              {run.started}–{run.endDate.replace(", 2026", "")}
            </span>
            <span>QA: {run.tester}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/runs/${run.id}?history=true`} />}
          >
            Run history
          </Button>
          <Button
            size="sm"
            disabled
            title="Run completion will be enabled with persistence integration."
          >
            Complete run
          </Button>
        </div>
      </div>
      <ExecutionWorkspace
        key={`${run.id}-${executionId ?? "default"}-${showHistory}`}
        run={run}
        initialExecutionId={executionId}
        initialShowHistory={showHistory}
      />
    </main>
  )
}
