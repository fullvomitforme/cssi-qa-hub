"use client"

import Image from "next/image"
import { useMemo, useState, useTransition } from "react"
import {
  BanIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  FileImageIcon,
  MessageSquareTextIcon,
  SkipForwardIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  saveExecutionAction,
  type SaveExecutionActionResult,
} from "@/app/actions/executions"
import { SeverityBadge } from "@/components/domain/severity-badge"
import { TestStatusBadge } from "@/components/domain/test-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { calculateExecutionMetrics } from "@/lib/execution-metrics"
import type {
  ExecutionFeedbackItem,
  ExecutionItem,
  ExecutionStatus,
  ExecutionWorkspaceRun,
  Severity,
} from "@/types/qa"

const statusIcons = {
  PASS: CheckIcon,
  FAIL: XIcon,
  BLOCKED: BanIcon,
  SKIPPED: SkipForwardIcon,
  NOT_TESTED: CircleDashedIcon,
} as const

const actionStyles = {
  PASS: "border-success-border text-success-text hover:bg-success-bg",
  FAIL: "border-destructive/30 text-destructive hover:bg-destructive/10",
  BLOCKED: "border-warning-border text-warning-text hover:bg-warning-bg",
  SKIPPED: "text-muted-foreground",
} as const

const feedbackTypes: ExecutionFeedbackItem["type"][] = [
  "BUG",
  "UX",
  "COPY",
  "IMPROVEMENT",
  "QUESTION",
]

type LocalEvidence = {
  id: string
  filename: string
  size: number
  previewUrl: string
}

type ExecutionWorkspaceProps = {
  run: ExecutionWorkspaceRun
  initialExecutionId?: string
  initialShowHistory?: boolean
  mode?: "demo" | "real"
  canMutate?: boolean
}

function cloneExecution(execution: ExecutionItem): ExecutionItem {
  return {
    ...execution,
    steps: execution.steps.map((step) => ({ ...step })),
    attempts: execution.attempts.map((attempt) => ({ ...attempt })),
    feedback: execution.feedback.map((item) => ({ ...item })),
  }
}

function cloneRun(run: ExecutionWorkspaceRun): ExecutionWorkspaceRun {
  return {
    ...run,
    executions: run.executions.map(cloneExecution),
  }
}

export function ExecutionWorkspace({
  run,
  initialExecutionId,
  initialShowHistory = false,
  mode = "demo",
  canMutate = false,
}: ExecutionWorkspaceProps) {
  const [runState, setRunState] = useState<ExecutionWorkspaceRun>(() =>
    cloneRun(run)
  )
  const [selectedId, setSelectedId] = useState(() =>
    run.executions.some((execution) => execution.id === initialExecutionId)
      ? (initialExecutionId as string)
      : run.executions[0]?.id
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "ALL">(
    "ALL"
  )
  const [pendingFailureId, setPendingFailureId] = useState<string | null>(null)
  const [collapsedModules, setCollapsedModules] = useState<string[]>([])
  const [evidence, setEvidence] = useState<Record<string, LocalEvidence[]>>({})
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {}
  )
  const [feedbackType, setFeedbackType] =
    useState<ExecutionFeedbackItem["type"]>("BUG")
  const [historyOpen, setHistoryOpen] = useState(initialShowHistory)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const executions = runState.executions
  const selected =
    executions.find((execution) => execution.id === selectedId) ?? executions[0]
  const metrics = useMemo(
    () => calculateExecutionMetrics(executions),
    [executions]
  )
  const filteredExecutions = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return executions.filter(
      (execution) =>
        (statusFilter === "ALL" || execution.status === statusFilter) &&
        (!needle ||
          `${execution.module} ${execution.title} ${execution.description}`
            .toLocaleLowerCase()
            .includes(needle))
    )
  }, [executions, search, statusFilter])
  const modules = useMemo(
    () =>
      Array.from(
        new Set(filteredExecutions.map((execution) => execution.module))
      ),
    [filteredExecutions]
  )
  const collapsedModuleSet = useMemo(
    () => new Set(collapsedModules),
    [collapsedModules]
  )
  const runHistory = useMemo(
    () =>
      executions.flatMap((execution) =>
        execution.attempts.map((attempt) => ({
          ...attempt,
          executionId: execution.id,
          scenario: execution.title,
        }))
      ),
    [executions]
  )

  if (!selected) {
    return <p className="p-6 text-sm text-muted-foreground">No scenarios.</p>
  }

  const selectedEvidence = evidence[selected.id] ?? []
  const failureDraftActive =
    selected.status === "FAIL" || pendingFailureId === selected.id
  const failureMissing = failureDraftActive
    ? [
        !selected.actualResult.trim() ? "actual result" : null,
        !selected.failureReason.trim() ? "failure reason" : null,
        !selected.severity ? "severity" : null,
      ].filter(Boolean)
    : []

  function updateSelected(patch: Partial<ExecutionItem>) {
    setSaveError(null)
    setSaveMessage(null)
    setRunState((current) => ({
      ...current,
      executions: current.executions.map((execution) =>
        execution.id === selectedId ? { ...execution, ...patch } : execution
      ),
    }))
  }

  function toggleStep(index: number) {
    setSaveError(null)
    setSaveMessage(null)
    setRunState((current) => ({
      ...current,
      executions: current.executions.map((execution) => {
        if (execution.id !== selectedId) return execution

        return {
          ...execution,
          steps: execution.steps.map((step, stepIndex) =>
            stepIndex === index
              ? {
                  ...step,
                  status: step.status === "PASS" ? null : "PASS",
                  actualResult: "",
                }
              : step
          ),
        }
      }),
    }))
  }

  function toggleModule(module: string) {
    setCollapsedModules((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
    )
  }

  function addFeedback() {
    const comment = feedbackDrafts[selected.id]?.trim()
    if (!comment) return

    updateSelected({
      feedback: [
        ...selected.feedback,
        {
          id: `feedback-${selected.id}-${Date.now()}`,
          type: feedbackType,
          comment,
          author: runState.tester,
          createdAt: "Just now",
        },
      ],
    })
    setFeedbackDrafts((current) => ({ ...current, [selected.id]: "" }))
  }

  function addEvidence(files: FileList | null) {
    if (mode !== "demo" || !files?.length) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const previewUrl = reader.result
        if (typeof previewUrl !== "string") return

        setEvidence((current) => ({
          ...current,
          [selected.id]: [
            ...(current[selected.id] ?? []),
            {
              id: `evidence-${selected.id}-${file.name}-${file.lastModified}`,
              filename: file.name,
              size: file.size,
              previewUrl,
            },
          ],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  function removeEvidence(id: string) {
    if (mode !== "demo") return

    setEvidence((current) => ({
      ...current,
      [selected.id]: (current[selected.id] ?? []).filter(
        (item) => item.id !== id
      ),
    }))
  }

  async function persistExecution(
    status: Exclude<ExecutionStatus, "NOT_TESTED">
  ): Promise<SaveExecutionActionResult> {
    return saveExecutionAction({
      runId: runState.id,
      executionId: selected.id,
      status,
      actualResult: selected.actualResult,
      failureReason: selected.failureReason,
      severity: selected.severity,
      bugReference: selected.bugReference,
      steps: selected.steps.map((step) => ({
        id: step.id,
        status: step.status,
        actualResult: step.actualResult,
      })),
    })
  }

  function setStatus(status: Exclude<ExecutionStatus, "NOT_TESTED">) {
    if (
      status === "FAIL" &&
      (!selected.actualResult.trim() ||
        !selected.failureReason.trim() ||
        !selected.severity)
    ) {
      setPendingFailureId(selected.id)
      return
    }

    if (mode === "demo") {
      setPendingFailureId(null)
      setExecutionsForDemoStatus(status)
      return
    }

    if (!canMutate) {
      setSaveError("You do not have permission to record results for this run.")
      return
    }

    setPendingFailureId(null)
    setSaveError(null)
    setSaveMessage(null)

    startTransition(async () => {
      const result = await persistExecution(status)

      if (result.status === "success" && result.run) {
        setRunState(cloneRun(result.run))
        setSaveMessage(result.message ?? "Execution saved.")
        return
      }

      setSaveError(result.message ?? "Unable to save this execution.")
    })
  }

  function setExecutionsForDemoStatus(
    status: Exclude<ExecutionStatus, "NOT_TESTED">
  ) {
    setRunState((current) => ({
      ...current,
      executions: current.executions.map((execution) => {
        if (execution.id !== selectedId) return execution
        if (execution.status === status) return execution

        const testedAt = "Aug 25, 2026 14:42"
        const attempts = [
          ...execution.attempts,
          {
            id: `${execution.id}-attempt-${execution.attempts.length + 1}`,
            number: execution.attempts.length + 1,
            status,
            build: current.build,
            testedAt,
            actualResult: execution.actualResult,
            failureReason: execution.failureReason,
            severity: execution.severity,
            bugReference: execution.bugReference,
          },
        ]

        return {
          ...execution,
          status,
          testedAt,
          attempts,
        }
      }),
    }))
  }

  return (
    <>
      <div className="grid min-h-[calc(100vh-7rem)] min-w-0 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="min-w-0 border-r">
          <div className="grid grid-cols-5 divide-x border-b bg-muted/20">
            {[
              {
                label: "Passed",
                value: metrics.passed,
                tone: "text-success-text",
              },
              {
                label: "Failed",
                value: metrics.failed,
                tone: "text-destructive",
              },
              {
                label: "Blocked",
                value: metrics.blocked,
                tone: "text-warning-text",
              },
              {
                label: "Skipped",
                value: metrics.skipped,
                tone: "text-muted-foreground",
              },
              {
                label: "Not Tested",
                value: metrics.notTested,
                tone: "text-muted-foreground",
              },
            ].map((item) => (
              <div key={item.label} className="px-3 py-3">
                <p
                  className={`text-xl font-semibold tabular-nums ${item.tone}`}
                >
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/10 px-3 py-2 text-xs">
            <span>
              Executed <strong>{metrics.executed}</strong> / {metrics.total}
            </span>
            <span>
              Coverage <strong>{metrics.coverage}%</strong>
            </span>
            <span>
              Pass rate <strong>{metrics.passRate}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 border-b p-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter scenarios…"
              className="max-w-72"
            />
            <label className="sr-only" htmlFor="execution-status-filter">
              Filter execution status
            </label>
            <select
              id="execution-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ExecutionStatus | "ALL")
              }
              className="h-8 rounded-lg border bg-background px-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="PASS">Passed</option>
              <option value="FAIL">Failed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="SKIPPED">Skipped</option>
              <option value="NOT_TESTED">Not Tested</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setHistoryOpen(true)}
            >
              Run history
            </Button>
          </div>
          {modules.length ? (
            <div className="divide-y">
              {modules.map((module) => {
                const items = filteredExecutions.filter(
                  (execution) => execution.module === module
                )
                const complete = items.filter(
                  (item) => item.status !== "NOT_TESTED"
                ).length
                const collapsed = collapsedModuleSet.has(module)
                return (
                  <section key={module}>
                    <button
                      type="button"
                      onClick={() => toggleModule(module)}
                      className="flex h-10 w-full items-center gap-2 bg-muted/30 px-3 text-left hover:bg-muted"
                    >
                      {collapsed ? (
                        <ChevronRightIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDownIcon className="size-4 text-muted-foreground" />
                      )}
                      <h2 className="text-sm font-semibold">{module}</h2>
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {complete} / {items.length}
                      </span>
                    </button>
                    {collapsed ? null : (
                      <div className="divide-y">
                        {items.map((execution) => {
                          const Icon = statusIcons[execution.status]
                          return (
                            <button
                              key={execution.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(execution.id)
                                setSaveError(null)
                                setSaveMessage(null)
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent ${execution.id === selectedId ? "bg-accent" : "bg-background"}`}
                            >
                              <Icon
                                className={`size-4 shrink-0 ${execution.status === "PASS" ? "text-success-text" : execution.status === "FAIL" ? "text-destructive" : execution.status === "BLOCKED" ? "text-warning-text" : "text-muted-foreground"}`}
                              />
                              <span className="min-w-0 flex-1 truncate text-sm">
                                {execution.title}
                              </span>
                              <TestStatusBadge status={execution.status} />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No scenarios match the current search and status filter.
            </p>
          )}
        </section>

        <aside className="qa-scrollbar min-w-0 bg-background lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <div className="sticky top-0 z-10 border-b bg-background p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selected.module}</Badge>
              <TestStatusBadge status={selected.status} />
            </div>
            <h2 className="mt-3 pr-8 text-base font-semibold">
              {selected.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.description}
            </p>
          </div>
          <div className="space-y-5 p-4">
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Preconditions
              </h3>
              <p className="mt-2 text-sm leading-6">{selected.preconditions}</p>
            </section>
            <Separator />
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Test steps
              </h3>
              <ol className="mt-2 space-y-2">
                {selected.steps.map((step, index) => {
                  const passed = step.status === "PASS"
                  return (
                    <li
                      key={step.id}
                      className="grid grid-cols-[24px_1fr_auto] items-start gap-2 text-sm"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
                        {step.position}
                      </span>
                      <span
                        className={`leading-5 ${passed ? "text-muted-foreground line-through" : ""}`}
                      >
                        {step.instruction}
                      </span>
                      <Button
                        variant={passed ? "secondary" : "ghost"}
                        size="icon-xs"
                        onClick={() => toggleStep(index)}
                        className={passed ? "text-success-text" : undefined}
                        aria-label={`${passed ? "Reset" : "Mark"} step ${index + 1} ${passed ? "result" : "passed"}`}
                        aria-pressed={passed}
                        disabled={mode === "real" && !canMutate}
                      >
                        <CheckIcon />
                      </Button>
                    </li>
                  )
                })}
              </ol>
            </section>
            <section className="border-l-2 border-success-border bg-success-bg p-3">
              <h3 className="text-xs font-semibold text-success-text">
                Expected result
              </h3>
              <p className="mt-1 text-sm leading-5">
                {selected.expectedResult}
              </p>
            </section>
            <Separator />
            <section className="space-y-3">
              {failureMissing.length ? (
                <p
                  role="alert"
                  className="border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
                >
                  Complete the required {failureMissing.join(", ")} before this
                  failure is ready to record.
                </p>
              ) : null}
              {saveError ? (
                <p
                  role="alert"
                  className="border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
                >
                  {saveError}
                </p>
              ) : null}
              {saveMessage ? (
                <p className="border border-success-border bg-success-bg p-3 text-xs text-success-text">
                  {saveMessage}
                </p>
              ) : null}
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Actual result{" "}
                {failureDraftActive ? (
                  <span className="text-destructive">*</span>
                ) : null}
                <Textarea
                  value={selected.actualResult}
                  onChange={(event) =>
                    updateSelected({ actualResult: event.target.value })
                  }
                  aria-invalid={
                    failureDraftActive && !selected.actualResult.trim()
                  }
                  className="mt-2 min-h-20"
                  placeholder="Describe what actually happened…"
                  disabled={mode === "real" && !canMutate}
                />
              </label>
              {failureDraftActive || selected.failureReason ? (
                <>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Failure reason <span className="text-destructive">*</span>
                    <Textarea
                      value={selected.failureReason}
                      onChange={(event) =>
                        updateSelected({ failureReason: event.target.value })
                      }
                      aria-invalid={!selected.failureReason.trim()}
                      className="mt-2 min-h-16"
                      placeholder="Explain why this scenario failed…"
                      disabled={mode === "real" && !canMutate}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">
                      Severity <span className="text-destructive">*</span>
                      <select
                        value={selected.severity ?? ""}
                        onChange={(event) =>
                          updateSelected({
                            severity: event.target.value
                              ? (event.target.value as Severity)
                              : null,
                          })
                        }
                        aria-invalid={!selected.severity}
                        className="mt-2 h-8 w-full rounded-lg border bg-background px-2 text-sm aria-invalid:border-destructive"
                        disabled={mode === "real" && !canMutate}
                      >
                        <option value="">Select severity</option>
                        <option>CRITICAL</option>
                        <option>HIGH</option>
                        <option>MEDIUM</option>
                        <option>LOW</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">
                      Bug reference
                      <Input
                        value={selected.bugReference}
                        onChange={(event) =>
                          updateSelected({ bugReference: event.target.value })
                        }
                        className="mt-2"
                        placeholder="PORTAL-000"
                        disabled={mode === "real" && !canMutate}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </section>
            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  Evidence
                </h3>
                {mode === "demo" ? (
                  <label className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-lg border px-2 text-xs font-medium hover:bg-muted">
                    <FileImageIcon className="size-3" />
                    Add evidence
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        addEvidence(event.target.files)
                        event.target.value = ""
                      }}
                    />
                  </label>
                ) : null}
              </div>
              {mode === "real" ? (
                <p className="mt-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Evidence uploads are connected in the next phase.
                </p>
              ) : selectedEvidence.length ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {selectedEvidence.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-md border"
                    >
                      <div className="relative aspect-video bg-muted/30">
                        <Image
                          src={item.previewUrl}
                          alt={`Evidence preview for ${item.filename}`}
                          fill
                          sizes="(min-width: 1024px) 240px, 50vw"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {item.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeEvidence(item.id)}
                          aria-label={`Remove ${item.filename}`}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <label className="mt-2 flex aspect-video cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
                  <FileImageIcon className="mb-1 size-5" />
                  Select screenshot
                  <span className="mt-1">Local preview only</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      addEvidence(event.target.files)
                      event.target.value = ""
                    }}
                  />
                </label>
              )}
            </section>
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Feedback
              </h3>
              {selected.feedback.length ? (
                <div className="mt-2 space-y-2">
                  {selected.feedback.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.author} · {item.createdAt}
                        </span>
                      </div>
                      <p className="mt-2">{item.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-md border p-3 text-sm text-muted-foreground">
                  {mode === "real"
                    ? "Feedback persistence is connected in the findings phase."
                    : "No feedback recorded for this execution."}
                </p>
              )}
              {mode === "demo" ? (
                <div className="mt-2 grid grid-cols-[8rem_minmax(0,1fr)_auto] gap-2">
                  <select
                    value={feedbackType}
                    onChange={(event) =>
                      setFeedbackType(
                        event.target.value as ExecutionFeedbackItem["type"]
                      )
                    }
                    aria-label="Feedback type"
                    className="h-8 rounded-lg border bg-background px-2 text-xs"
                  >
                    {feedbackTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <Input
                    value={feedbackDrafts[selected.id] ?? ""}
                    onChange={(event) =>
                      setFeedbackDrafts((current) => ({
                        ...current,
                        [selected.id]: event.target.value,
                      }))
                    }
                    placeholder="Add execution feedback…"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addFeedback()
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={addFeedback}
                    aria-label="Add feedback"
                    disabled={!feedbackDrafts[selected.id]?.trim()}
                  >
                    <MessageSquareTextIcon />
                  </Button>
                </div>
              ) : null}
            </section>
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Attempt history
              </h3>
              {selected.attempts.length ? (
                <ol className="mt-3 space-y-3 border-l pl-4">
                  {selected.attempts.map((attempt) => (
                    <li key={attempt.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Attempt {attempt.number}
                        </span>
                        <TestStatusBadge status={attempt.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Build {attempt.build} · {attempt.testedAt}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No execution attempts recorded yet.
                </p>
              )}
            </section>
            <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Tester</dt>
                <dd className="mt-1 font-medium">{selected.tester}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tested at</dt>
                <dd className="mt-1 font-medium">
                  {selected.testedAt ?? "Not tested"}
                </dd>
              </div>
              {selected.severity ? (
                <div>
                  <dt className="text-muted-foreground">Severity</dt>
                  <dd className="mt-1">
                    <SeverityBadge severity={selected.severity} />
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="sticky bottom-0 border-t bg-background p-3">
            {mode === "real" && !canMutate ? (
              <p className="mb-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                You can view this run, but only assigned testers, QA leads, and
                admins can record execution results.
              </p>
            ) : null}
            <div className="grid grid-cols-4 gap-2">
              {(["PASS", "FAIL", "BLOCKED", "SKIPPED"] as const).map(
                (status) => {
                  const Icon = statusIcons[status]
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(status)}
                      aria-pressed={
                        selected.status === status ||
                        (status === "FAIL" && pendingFailureId === selected.id)
                      }
                      disabled={mode === "real" && (!canMutate || isPending)}
                      className={`${actionStyles[status]} ${selected.status === status || (status === "FAIL" && pendingFailureId === selected.id) ? "ring-2 ring-ring" : ""}`}
                    >
                      <Icon data-icon="inline-start" />
                      {status === "SKIPPED"
                        ? "Skip"
                        : status.charAt(0) +
                          status.slice(1).toLocaleLowerCase()}
                    </Button>
                  )
                }
              )}
            </div>
          </div>
        </aside>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Run history</SheetTitle>
            <SheetDescription>
              {mode === "demo" ? "Local" : "Persisted"} attempt history for{" "}
              {runState.name} · Build {runState.build}
            </SheetDescription>
          </SheetHeader>
          <div className="qa-scrollbar flex-1 overflow-y-auto p-4">
            {runHistory.length ? (
              <ol className="space-y-4 border-l pl-4">
                {runHistory.map((attempt) => (
                  <li
                    key={`${attempt.executionId}-${attempt.id}-${attempt.testedAt}`}
                  >
                    <p className="text-sm font-medium">{attempt.scenario}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs">Attempt {attempt.number}</span>
                      <TestStatusBadge status={attempt.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Build {attempt.build} · {attempt.testedAt}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attempts have been recorded for this run.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
