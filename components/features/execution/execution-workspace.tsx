"use client"

import { useMemo, useState } from "react"
import {
  BanIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  FileImageIcon,
  MessageSquareTextIcon,
  MoreHorizontalIcon,
  SkipForwardIcon,
  XIcon,
} from "lucide-react"

import { SeverityBadge } from "@/components/domain/severity-badge"
import { TestStatusBadge } from "@/components/domain/test-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { portalExecutions, type MockExecution } from "@/lib/data/product-seed"
import type { ExecutionStatus } from "@/types/qa"

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

export function ExecutionWorkspace() {
  const [executions, setExecutions] =
    useState<MockExecution[]>(portalExecutions)
  const [selectedId, setSelectedId] = useState(portalExecutions[0].id)
  const selected =
    executions.find((execution) => execution.id === selectedId) ?? executions[0]
  const modules = useMemo(
    () => Array.from(new Set(executions.map((execution) => execution.module))),
    [executions]
  )

  const counts = executions.reduce(
    (result, execution) => ({
      ...result,
      [execution.status]: result[execution.status] + 1,
    }),
    {
      PASS: 87,
      FAIL: 5,
      BLOCKED: 2,
      SKIPPED: 0,
      NOT_TESTED: 20,
    } satisfies Record<ExecutionStatus, number>
  )

  function setStatus(status: ExecutionStatus) {
    setExecutions((current) =>
      current.map((execution) =>
        execution.id === selectedId
          ? {
              ...execution,
              status,
              testedAt: status === "NOT_TESTED" ? null : "Aug 25, 2026 14:42",
            }
          : execution
      )
    )
  }

  function updateSelected(patch: Partial<MockExecution>) {
    setExecutions((current) =>
      current.map((execution) =>
        execution.id === selectedId ? { ...execution, ...patch } : execution
      )
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] min-w-0 lg:grid-cols-[minmax(0,1fr)_460px]">
      <section className="min-w-0 border-r">
        <div className="grid grid-cols-4 divide-x border-b bg-muted/20">
          {[
            { label: "Passed", value: counts.PASS, tone: "text-success-text" },
            { label: "Failed", value: counts.FAIL, tone: "text-destructive" },
            {
              label: "Blocked",
              value: counts.BLOCKED,
              tone: "text-warning-text",
            },
            {
              label: "Untested",
              value: counts.NOT_TESTED,
              tone: "text-muted-foreground",
            },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3">
              <p className={`text-xl font-semibold tabular-nums ${item.tone}`}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-b p-2">
          <Input placeholder="Filter scenarios…" className="max-w-72" />
          <Button variant="outline" size="sm">
            All statuses
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="More run actions"
          >
            <MoreHorizontalIcon />
          </Button>
        </div>
        <div className="divide-y">
          {modules.map((module) => {
            const items = executions.filter(
              (execution) => execution.module === module
            )
            const complete = items.filter(
              (item) => item.status !== "NOT_TESTED"
            ).length
            return (
              <section key={module}>
                <header className="flex h-10 items-center gap-2 bg-muted/30 px-3">
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{module}</h2>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {complete} / {items.length}
                  </span>
                </header>
                <div className="divide-y">
                  {items.map((execution) => {
                    const Icon = statusIcons[execution.status]
                    return (
                      <button
                        key={execution.id}
                        type="button"
                        onClick={() => setSelectedId(execution.id)}
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
              </section>
            )
          })}
        </div>
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
              {selected.steps.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-2 text-sm"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <span className="leading-5">{step}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Mark step ${index + 1} passed`}
                  >
                    <CheckIcon />
                  </Button>
                </li>
              ))}
            </ol>
          </section>
          <section className="border-l-2 border-success-border bg-success-bg p-3">
            <h3 className="text-xs font-semibold text-success-text">
              Expected result
            </h3>
            <p className="mt-1 text-sm leading-5">{selected.expectedResult}</p>
          </section>
          <Separator />
          <section className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              Actual result
              <Textarea
                value={selected.actualResult}
                onChange={(event) =>
                  updateSelected({ actualResult: event.target.value })
                }
                className="mt-2 min-h-20"
                placeholder="Describe what actually happened…"
              />
            </label>
            {selected.status === "FAIL" || selected.failureReason ? (
              <>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Failure reason
                  <Textarea
                    value={selected.failureReason}
                    onChange={(event) =>
                      updateSelected({ failureReason: event.target.value })
                    }
                    className="mt-2 min-h-16"
                    placeholder="Explain why this scenario failed…"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Severity
                    <select
                      value={selected.severity ?? "MEDIUM"}
                      onChange={(event) =>
                        updateSelected({
                          severity: event.target
                            .value as MockExecution["severity"],
                        })
                      }
                      className="mt-2 h-8 w-full rounded-lg border bg-background px-2 text-sm"
                    >
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
              <Button variant="outline" size="xs">
                <FileImageIcon data-icon="inline-start" />
                Add evidence
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="flex aspect-video items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground">
                <FileImageIcon className="size-6" />
              </div>
              <button
                type="button"
                className="flex aspect-video flex-col items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent"
              >
                <FileImageIcon className="mb-1 size-5" />
                Upload screenshot
              </button>
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Feedback
              </h3>
              <Button variant="ghost" size="xs">
                <MessageSquareTextIcon data-icon="inline-start" />
                Add feedback
              </Button>
            </div>
            <p className="mt-2 rounded-md border p-3 text-sm text-muted-foreground">
              No feedback recorded for this execution.
            </p>
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
        <div className="sticky bottom-0 grid grid-cols-4 gap-2 border-t bg-background p-3">
          {(["PASS", "FAIL", "BLOCKED", "SKIPPED"] as const).map((status) => {
            const Icon = statusIcons[status]
            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => setStatus(status)}
                className={actionStyles[status]}
              >
                <Icon data-icon="inline-start" />
                {status === "SKIPPED"
                  ? "Skip"
                  : status.charAt(0) + status.slice(1).toLocaleLowerCase()}
              </Button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
