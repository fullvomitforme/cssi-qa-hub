import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { RunEditor } from "@/components/features/runs/run-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTestRunDetail } from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import { buildDemoExecutionWorkspaceFromRun } from "@/lib/execution-adapters"
import { toRunFormValues } from "@/lib/run-adapters"
import { requireUser } from "@/services/auth"
import { getRunExecutionWorkspace } from "@/services/executions"
import { getRun, listRunReferences } from "@/services/runs"

async function getRunTitle(runId: string) {
  if (shouldUseDemoData()) {
    const run = getTestRunDetail(runId)
    return run?.name ?? "Test Run"
  }

  const run = await getRun(runId)
  return run?.name ?? "Test Run"
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ runId: string }>
}): Promise<Metadata> {
  const { runId } = await params
  return { title: await getRunTitle(runId) }
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
  const executionId =
    typeof query.execution === "string" ? query.execution : undefined
  const showHistory = query.history === "true"

  if (shouldUseDemoData()) {
    const run = getTestRunDetail(runId)
    if (!run) notFound()

    const workspaceRun = buildDemoExecutionWorkspaceFromRun(run)

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
            <h1 className="text-lg font-semibold">{workspaceRun.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{workspaceRun.environment}</Badge>
              <span>
                Build{" "}
                <span className="font-mono text-foreground">
                  {workspaceRun.build}
                </span>
              </span>
              <span>Release {workspaceRun.release}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="size-3" />
                {workspaceRun.startedLabel}–{workspaceRun.endDateLabel}
              </span>
              <span>QA: {workspaceRun.tester}</span>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/runs/${workspaceRun.id}?history=true`} />}
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
          key={`${workspaceRun.id}-${executionId ?? "default"}-${showHistory}`}
          run={workspaceRun}
          initialExecutionId={executionId}
          initialShowHistory={showHistory}
          mode="demo"
          canMutate
        />
      </main>
    )
  }

  const [profile, run, workspaceRun, references] = await Promise.all([
    requireUser(),
    getRun(runId),
    getRunExecutionWorkspace(runId),
    listRunReferences(),
  ])

  if (!run || !workspaceRun) {
    notFound()
  }

  const canExecute =
    profile.role !== "QA_TESTER" ||
    run.assignments.some((assignment) => assignment.profileId === profile.id)

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
          <h1 className="text-lg font-semibold">{workspaceRun.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{workspaceRun.environment}</Badge>
            <span>
              Build{" "}
              <span className="font-mono text-foreground">
                {workspaceRun.build}
              </span>
            </span>
            <span>Release {workspaceRun.release}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="size-3" />
              {workspaceRun.startedLabel}–{workspaceRun.endDateLabel}
            </span>
            <span>QA: {workspaceRun.tester}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {profile.role !== "QA_TESTER" ? (
            <RunEditor
              initialValues={toRunFormValues(run)}
              references={references}
              role={profile.role}
              runId={run.id}
            />
          ) : null}
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/runs/${workspaceRun.id}?history=true`} />}
          >
            Run history
          </Button>
        </div>
      </div>
      <ExecutionWorkspace
        key={`${workspaceRun.id}-${executionId ?? "default"}-${showHistory}`}
        run={workspaceRun}
        initialExecutionId={executionId}
        initialShowHistory={showHistory}
        mode="real"
        canMutate={canExecute}
      />
    </main>
  )
}
