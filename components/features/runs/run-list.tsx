"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { createRunAction, type RunActionState } from "@/app/actions/runs"
import { RunFormSheet } from "@/components/features/runs/run-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RunReferences, RunSummary } from "@/types/qa"

const variants = {
  BLOCKED: "warning",
  CANCELLED: "outline",
  COMPLETED: "success",
  IN_PROGRESS: "info",
  NOT_STARTED: "neutral",
} as const

type LocalRun = RunSummary

export function RunList({
  canManage,
  filters,
  initialCreateOpen = false,
  initialRuns,
  isDemoMode,
  references,
}: {
  canManage: boolean
  filters: { application?: string; search?: string; status?: string }
  initialCreateOpen?: boolean
  initialRuns: RunSummary[]
  isDemoMode: boolean
  references: RunReferences
}) {
  const [runs, setRuns] = useState(initialRuns)
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const [search, setSearch] = useState(filters.search ?? "")
  const [application, setApplication] = useState(filters.application ?? "all")
  const [status, setStatus] = useState(filters.status ?? "all")
  const [notice, setNotice] = useState<string | null>(null)

  function applyFilters(
    nextSearch: string,
    nextApplication: string,
    nextStatus: string
  ) {
    const params = new URLSearchParams()
    if (nextSearch) params.set("search", nextSearch)
    if (nextApplication !== "all") params.set("application", nextApplication)
    if (nextStatus !== "all") params.set("status", nextStatus)
    window.location.href = `/runs${params.size > 0 ? `?${params.toString()}` : ""}`
  }

  async function createLocalRunAction(
    _: RunActionState,
    formData: FormData
  ): Promise<RunActionState> {
    const selectedApplication = references.applications.find(
      (item) => item.id === String(formData.get("applicationId"))
    )
    const selectedEnvironment = references.environments.find(
      (item) => item.id === String(formData.get("environmentId"))
    )
    const selectedRelease = references.releases.find(
      (item) => item.id === String(formData.get("releaseId"))
    )
    const selectedPlan = references.planOptions.find(
      (item) => item.id === String(formData.get("testPlanId"))
    )
    const assignmentIds = JSON.parse(
      String(formData.get("assignmentProfileIds") ?? "[]")
    ) as string[]
    const assignees = references.assigneeOptions.filter((item) =>
      assignmentIds.includes(item.id)
    )

    if (
      !selectedApplication ||
      !selectedEnvironment ||
      !selectedRelease ||
      !selectedPlan
    ) {
      return {
        status: "error",
        message: "Demo run references are incomplete.",
      }
    }

    const nextRun: LocalRun = {
      id: `local-run-${Date.now()}`,
      name: String(formData.get("name") ?? ""),
      application: selectedApplication.name,
      applicationSlug: selectedApplication.slug ?? "unknown",
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      release: selectedRelease.version,
      build: String(formData.get("build") ?? ""),
      environment: selectedEnvironment.name,
      testerLabel:
        assignees.length === 0
          ? "Unassigned"
          : assignees.length === 1
            ? assignees[0].fullName
            : `${assignees[0].fullName}, ${assignees[1]?.fullName ?? ""}`.replace(
                /, $/,
                ""
              ),
      progress: 0,
      passRate: 0,
      status: String(
        formData.get("status") ?? "IN_PROGRESS"
      ) as LocalRun["status"],
      startedAt: "Just now",
      completedAt: null,
    }

    setRuns((current) => [nextRun, ...current])
    setNotice("Local demo run created in this browser session.")

    return {
      status: "success",
      message: "Local run created.",
      runId: nextRun.id,
    }
  }

  return (
    <>
      {notice ? (
        <p className="mx-3 mt-3 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters(search, application, status)
              }
            }}
            placeholder="Search test runs…"
            className="pl-8"
          />
        </div>

        <Select
          value={application}
          onValueChange={(value) => setApplication(value ?? "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All applications</SelectItem>
            {references.applications.map((item) => (
              <SelectItem key={item.id} value={item.slug ?? item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value ?? "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={() => applyFilters(search, application, status)}
        >
          Apply filters
        </Button>

        {canManage ? (
          <Button
            className="ml-auto"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Start Test Run
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test run</TableHead>
              <TableHead>Release / Build</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Assigned QA</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Pass rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              const localOnly = run.id.startsWith("local-run-")

              return (
                <TableRow key={run.id}>
                  <TableCell>
                    {localOnly ? (
                      <span className="font-medium">{run.name}</span>
                    ) : (
                      <Link
                        href={`/runs/${run.id}`}
                        className="font-medium hover:underline"
                      >
                        {run.name}
                      </Link>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {run.application}
                      {localOnly ? " · Local session" : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{run.release}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {run.build}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{run.environment}</Badge>
                  </TableCell>
                  <TableCell>{run.testerLabel}</TableCell>
                  <TableCell className="min-w-40">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">Executed</span>
                      <span>{run.progress}%</span>
                    </div>
                    <Progress value={run.progress} />
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {run.passRate}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={variants[run.status]}>
                      {run.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
                      {run.startedAt ?? "Not started"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {localOnly ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        title="Local run execution is available after persistence integration."
                        aria-label={`${run.name} is local-only`}
                      >
                        <ArrowRightIcon />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/runs/${run.id}`} />}
                        aria-label={`Open ${run.name}`}
                      >
                        <ArrowRightIcon />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {runs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No test runs match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {canManage ? (
        <RunFormSheet
          action={isDemoMode ? createLocalRunAction : createRunAction}
          description={
            isDemoMode
              ? "Create a local draft run for demo mode."
              : "Create a persisted test run and assign real QA members."
          }
          initialValues={
            isDemoMode
              ? {
                  name: "",
                  applicationId: references.applications[0]?.id ?? "",
                  testPlanId: references.planOptions[0]?.id ?? "",
                  releaseId: references.releases[0]?.id ?? "",
                  environmentId: references.environments[0]?.id ?? "",
                  build: "",
                  status: "IN_PROGRESS",
                  assignmentProfileIds: [],
                }
              : undefined
          }
          onOpenChange={setCreateOpen}
          onSuccess={(runId) => {
            setCreateOpen(false)
            if (!isDemoMode) {
              setNotice(`Run saved. Open /runs/${runId} to review details.`)
            }
          }}
          open={createOpen}
          references={references}
          submitLabel={isDemoMode ? "Start local run" : "Start test run"}
          title="Start Test Run"
        />
      ) : null}
    </>
  )
}
