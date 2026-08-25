import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { RunEditor } from "@/components/features/runs/run-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTestRunDetail } from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import { toRunFormValues } from "@/lib/run-adapters"
import { requireUser } from "@/services/auth"
import { getRun, listRunReferences } from "@/services/runs"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
})

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

  if (shouldUseDemoData()) {
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

  const [profile, run, references] = await Promise.all([
    requireUser(),
    getRun(runId),
    listRunReferences(),
  ])

  if (!run) notFound()

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/runs" />}
          aria-label="Back to test runs"
        >
          <ArrowLeftIcon />
        </Button>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{run.application}</Badge>
            <Badge variant="neutral">{run.environment}</Badge>
            <Badge variant="outline">{run.status}</Badge>
          </div>
          <h1 className="text-xl font-semibold">{run.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Build{" "}
              <span className="font-mono text-foreground">{run.build}</span>
            </span>
            <span>Release {run.release}</span>
            <span>Plan {run.planName}</span>
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
            size="sm"
            disabled
            title="Persistent execution workspace is completed in the next integration phase."
          >
            Open execution workspace
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Assigned QA Members</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="divide-y">
                {run.assignments.map((assignment) => (
                  <li
                    key={assignment.profileId}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{assignment.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {assignment.role} · {assignment.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(assignment.assignedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Execution Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="divide-y">
                {run.scenarios.map((scenario) => (
                  <li key={scenario.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{scenario.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Snapshot source {scenario.sourceScenarioId}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{scenario.type}</Badge>
                        <Badge variant="neutral">{scenario.priority}</Badge>
                        <Badge variant="outline">{scenario.status}</Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Run Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Plan</dt>
                <dd className="mt-1 font-medium">{run.planName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Executed</dt>
                <dd className="mt-1 font-medium">
                  {run.executionSummary.executed} / {run.executionSummary.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pass rate</dt>
                <dd className="mt-1 font-medium">{run.passRate}%</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Started</dt>
                <dd className="mt-1 font-medium">
                  {run.startedAt
                    ? dateFormatter.format(new Date(run.startedAt))
                    : "Not started"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Completed</dt>
                <dd className="mt-1 font-medium">
                  {run.completedAt
                    ? dateFormatter.format(new Date(run.completedAt))
                    : "Not completed"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(run.createdAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {run.createdBy}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last updated</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(run.updatedAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {run.updatedBy}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
