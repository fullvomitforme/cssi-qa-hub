"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  FileOutputIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
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
import { reports, testRuns } from "@/lib/data/product-seed"
import { createReportAction } from "@/app/actions/reports"
import type { ReportListItem, ReportRunOption } from "@/services/reports"

const variants = {
  PASS: "success",
  CONDITIONAL_PASS: "warning",
  FAIL: "destructive",
} as const

type LocalReport = {
  id: string
  number: string
  application: string
  release: string
  environment: string
  result: keyof typeof variants
  generatedBy: string
  generatedAt: string
}

export function ReportList({
  initialItems,
  runOptions,
  mode = "demo",
}: {
  initialItems?: ReportListItem[]
  runOptions?: ReportRunOption[]
  mode?: "demo" | "real"
}) {
  const [items, setItems] = useState<LocalReport[]>(() =>
    (initialItems ?? reports).map((report) => ({ ...report }))
  )
  const [search, setSearch] = useState("")
  const [application, setApplication] = useState("ALL")
  const [result, setResult] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const applications = Array.from(
    new Set(items.map((report) => report.application))
  ).sort()
  const filteredReports = items.filter((report) => {
    const needle = search.trim().toLocaleLowerCase()
    return (
      (!needle ||
        `${report.number} ${report.application} ${report.release}`
          .toLocaleLowerCase()
          .includes(needle)) &&
      (application === "ALL" || report.application === application) &&
      (result === "ALL" || report.result === result)
    )
  })

  function generateReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const reportApplication = String(form.get("application"))
    if (mode === "real") {
      startTransition(async () => {
        const result = await createReportAction({
          runId: String(form.get("run")),
          result: String(form.get("result")) as ReportListItem["result"],
          conclusion: String(form.get("conclusion")),
        })
        if (result.status === "success")
          window.location.href = `/reports/${result.reportId}`
      })
      return
    }
    const report: LocalReport = {
      id: `local-report-${Date.now()}`,
      number: `QA-${reportApplication.toLocaleUpperCase().replaceAll(" ", "-")}-LOCAL-${String(items.length + 1).padStart(3, "0")}`,
      application: reportApplication,
      release: "v1.9.0",
      environment: "UAT",
      result: String(form.get("result")) as LocalReport["result"],
      generatedBy: String(form.get("preparedBy")),
      generatedAt: "Just now",
    }
    setItems((current) => [report, ...current])
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
            placeholder="Search report number or application…"
            className="pl-8"
          />
        </div>
        <Select
          value={application}
          onValueChange={(v) => setApplication(v ?? "ALL")}
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="All applications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All applications</SelectItem>
            {applications.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={result} onValueChange={(v) => setResult(v ?? "ALL")}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All results</SelectItem>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="CONDITIONAL_PASS">Conditional Pass</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="ml-auto"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon data-icon="inline-start" />
          Generate Report
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report number</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Release</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Generated by</TableHead>
              <TableHead>Generated at</TableHead>
              <TableHead>
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => {
              const localOnly = report.id.startsWith("local-report-")
              return (
                <TableRow key={report.id}>
                  <TableCell>
                    {localOnly ? (
                      <span className="inline-flex items-center gap-2 font-mono text-xs font-medium">
                        <FileOutputIcon className="size-4" />
                        {report.number}
                      </span>
                    ) : (
                      <Link
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-2 font-mono text-xs font-medium hover:underline"
                      >
                        <FileOutputIcon className="size-4" />
                        {report.number}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {report.application}
                  </TableCell>
                  <TableCell>{report.release}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variants[report.result]}>
                      {report.result.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.generatedBy}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {report.generatedAt}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        localOnly ? undefined : (
                          <Link href={`/reports/${report.id}`} />
                        )
                      }
                      disabled={localOnly}
                      title={
                        localOnly
                          ? "Local report configuration is not persisted."
                          : undefined
                      }
                      aria-label={
                        localOnly
                          ? `${report.number} is local-only`
                          : `Open ${report.number}`
                      }
                    >
                      <ArrowRightIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>Generate QA Report</SheetTitle>
            <SheetDescription>
              {mode === "real"
                ? "Finalize an immutable report snapshot from a real test run."
                : "Configure a local report entry. Formal preview data remains mock-driven."}
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={generateReport}
          >
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
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
                Test run
                <select
                  name="run"
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                >
                  {(mode === "real" ? (runOptions ?? []) : testRuns).map(
                    (run) => (
                      <option key={run.id} value={run.id}>
                        {run.name}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="text-sm font-medium">
                Report result
                <select
                  name="result"
                  defaultValue="CONDITIONAL_PASS"
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                >
                  <option value="PASS">PASS</option>
                  <option value="CONDITIONAL_PASS">CONDITIONAL PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Conclusion
                <Textarea name="conclusion" className="mt-1.5" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Prepared by
                  <Input
                    name="preparedBy"
                    defaultValue="Andi Pratama"
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Reviewed by
                  <Input
                    name="reviewedBy"
                    defaultValue="Siti Aisyah"
                    className="mt-1.5"
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === "real"
                  ? "The finalized snapshot and private PDF are stored in Supabase."
                  : "Server PDF generation and persistence are intentionally deferred."}
              </p>
            </div>
            <SheetFooter className="border-t">
              <Button type="submit" disabled={isPending}>
                {mode === "real" ? "Finalize report" : "Generate local entry"}
              </Button>
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
