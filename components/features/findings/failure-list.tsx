"use client"

import { useState } from "react"
import Link from "next/link"
import { BugIcon, ExternalLinkIcon, SearchIcon } from "lucide-react"

import { SeverityBadge } from "@/components/domain/severity-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { failureItems, getTestRunDetail } from "@/lib/data/product-seed"

type Failure = (typeof failureItems)[number]

export function FailureList() {
  const [selected, setSelected] = useState<Failure | null>(null)
  const [search, setSearch] = useState("")
  const [application, setApplication] = useState("ALL")
  const [severity, setSeverity] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [retest, setRetest] = useState("ALL")
  const filteredFailures = failureItems.filter((failure) => {
    const needle = search.trim().toLocaleLowerCase()
    return (
      (!needle ||
        `${failure.scenario} ${failure.application} ${failure.feature} ${failure.bugReference}`
          .toLocaleLowerCase()
          .includes(needle)) &&
      (application === "ALL" || failure.application === application) &&
      (severity === "ALL" || failure.severity === severity) &&
      (status === "ALL" || failure.status === status) &&
      (retest === "ALL" || failure.retestStatus === retest)
    )
  })
  const selectedRun = selected ? getTestRunDetail(selected.runId) : undefined
  const selectedExecution = selectedRun?.executions.find(
    (execution) => execution.id === selected?.executionId
  )
  const selectedAttempts = selectedExecution?.attempts?.length
    ? [...selectedExecution.attempts].reverse()
    : selected
      ? [
          {
            number: 1,
            status: "FAIL" as const,
            build: selectedRun?.build ?? "Unknown",
            testedAt: selected.foundAt,
          },
        ]
      : []
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative max-w-80 flex-1">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search failures…"
            className="pl-8"
          />
        </div>
        <select
          value={application}
          onChange={(event) => setApplication(event.target.value)}
          aria-label="Filter failures by application"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All applications</option>
          {Array.from(
            new Set(failureItems.map((item) => item.application))
          ).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          aria-label="Filter failures by severity"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All severities</option>
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter failures by status"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          {Array.from(new Set(failureItems.map((item) => item.status))).map(
            (item) => (
              <option key={item}>{item.replaceAll("_", " ")}</option>
            )
          )}
        </select>
        <select
          value={retest}
          onChange={(event) => setRetest(event.target.value)}
          aria-label="Filter failures by retest status"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All retest states</option>
          {Array.from(
            new Set(failureItems.map((item) => item.retestStatus))
          ).map((item) => (
            <option key={item}>{item.replaceAll("_", " ")}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredFailures.length} findings
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bug reference</TableHead>
              <TableHead>Found by</TableHead>
              <TableHead>Found at</TableHead>
              <TableHead>Retest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFailures.map((failure) => (
              <TableRow
                key={failure.id}
                onClick={() => setSelected(failure)}
                className="cursor-pointer"
              >
                <TableCell className="max-w-80">
                  <div className="flex items-start gap-2">
                    <BugIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span className="font-medium">{failure.scenario}</span>
                  </div>
                </TableCell>
                <TableCell>{failure.application}</TableCell>
                <TableCell className="text-muted-foreground">
                  {failure.feature}
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={failure.severity} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      failure.status === "FIXED"
                        ? "success"
                        : failure.status === "OPEN"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {failure.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">
                    {failure.bugReference}
                  </span>
                </TableCell>
                <TableCell>{failure.foundBy}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {failure.foundAt}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      failure.retestStatus === "PASSED"
                        ? "success"
                        : failure.retestStatus === "FAILED_AGAIN"
                          ? "destructive"
                          : "neutral"
                    }
                  >
                    {failure.retestStatus.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="border-b pr-12">
                <div className="mb-2 flex gap-2">
                  <SeverityBadge severity={selected.severity} />
                  <Badge variant="destructive">{selected.status}</Badge>
                </div>
                <SheetTitle>{selected.scenario}</SheetTitle>
                <SheetDescription>
                  {selected.application} / {selected.feature}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Failure reason
                  </h3>
                  <p className="mt-2 text-sm leading-6">
                    The observed result differs from the scenario snapshot and
                    prevents acceptance of this behavior in the current build.
                  </p>
                </section>
                <section className="grid grid-cols-2 gap-4 border-y py-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Bug reference
                    </p>
                    <p className="mt-1 font-mono">{selected.bugReference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Retest status
                    </p>
                    <p className="mt-1 font-medium">
                      {selected.retestStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Found by</p>
                    <p className="mt-1">{selected.foundBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Found at</p>
                    <p className="mt-1">{selected.foundAt}</p>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Attempt history
                  </h3>
                  <ol className="mt-3 space-y-4 border-l pl-4">
                    {selectedAttempts.map((attempt) => (
                      <li key={`${attempt.number}-${attempt.testedAt}`}>
                        <p className="text-sm font-medium">
                          Attempt {attempt.number} ·{" "}
                          {attempt.status.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Build {attempt.build} · {attempt.testedAt}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/runs/${selected.runId}?execution=${selected.executionId}`}
                    />
                  }
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  Open original execution
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
