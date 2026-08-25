"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { testPlans, testRuns } from "@/lib/data/product-seed"

const variants = {
  IN_PROGRESS: "info",
  BLOCKED: "warning",
  COMPLETED: "success",
} as const

type LocalRun = {
  id: string
  name: string
  application: string
  release: string
  build: string
  environment: string
  tester: string
  progress: number
  passRate: number
  status: keyof typeof variants
  started: string
}

export function RunList({
  initialCreateOpen = false,
}: {
  initialCreateOpen?: boolean
}) {
  const [runs, setRuns] = useState<LocalRun[]>(() =>
    testRuns.map((run) => ({ ...run }))
  )
  const [search, setSearch] = useState("")
  const [application, setApplication] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)

  const applications = useMemo(
    () => Array.from(new Set(runs.map((run) => run.application))).sort(),
    [runs]
  )
  const filteredRuns = runs.filter((run) => {
    const needle = search.trim().toLocaleLowerCase()
    return (
      (!needle ||
        `${run.name} ${run.application} ${run.release} ${run.build} ${run.tester}`
          .toLocaleLowerCase()
          .includes(needle)) &&
      (application === "ALL" || run.application === application) &&
      (status === "ALL" || run.status === status)
    )
  })

  function createRun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const run: LocalRun = {
      id: `local-run-${Date.now()}`,
      name: String(form.get("name")),
      application: String(form.get("application")),
      release: String(form.get("release")),
      build: String(form.get("build")),
      environment: String(form.get("environment")),
      tester: String(form.get("tester")),
      progress: 0,
      passRate: 0,
      status: "IN_PROGRESS",
      started: "Just now",
    }
    setRuns((current) => [run, ...current])
    setCreateOpen(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search test runs…"
            className="pl-8"
          />
        </div>
        <select
          value={application}
          onChange={(event) => setApplication(event.target.value)}
          aria-label="Filter by application"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All applications</option>
          {applications.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by run status"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <Button
          className="ml-auto"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon data-icon="inline-start" />
          Start Test Run
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test run</TableHead>
              <TableHead>Release / Build</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Tester</TableHead>
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
            {filteredRuns.map((run) => {
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
                  <TableCell>{run.tester}</TableCell>
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
                      {run.started}
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
          </TableBody>
        </Table>
        {filteredRuns.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No test runs match the current filters.
          </p>
        ) : null}
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>Start Test Run</SheetTitle>
            <SheetDescription>
              Create an in-progress run for this local frontend session.
            </SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col" onSubmit={createRun}>
            <div className="grid flex-1 gap-4 p-4">
              <label className="text-sm font-medium">
                Run name
                <Input
                  name="name"
                  className="mt-1.5"
                  placeholder="Portal Regression — v1.10.0"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Application
                  <select
                    name="application"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {applications.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Test plan
                  <select
                    name="plan"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {testPlans.map((plan) => (
                      <option key={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm font-medium">
                  Release
                  <Input
                    name="release"
                    defaultValue="v1.9.0"
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Environment
                  <select
                    name="environment"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    <option>UAT</option>
                    <option>STAGING</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Build
                  <Input
                    name="build"
                    className="mt-1.5 font-mono"
                    placeholder="a829d41"
                    required
                  />
                </label>
              </div>
              <label className="text-sm font-medium">
                Assigned tester
                <select
                  name="tester"
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                >
                  <option>Andi Pratama</option>
                  <option>Siti Aisyah</option>
                  <option>Budi Santoso</option>
                  <option>Dewi Larasati</option>
                </select>
              </label>
              <p className="text-xs text-muted-foreground">
                Local runs appear in this list but do not create persisted
                execution records.
              </p>
            </div>
            <SheetFooter className="border-t">
              <Button type="submit">Start local run</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
