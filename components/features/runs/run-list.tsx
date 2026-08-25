import Link from "next/link"
import { ArrowRightIcon, CalendarDaysIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { testRuns } from "@/lib/data/product-seed"

const variants = {
  IN_PROGRESS: "info",
  BLOCKED: "warning",
  COMPLETED: "success",
} as const

export function RunList() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Input placeholder="Search test runs…" className="max-w-80" />
        <Button variant="outline" size="sm">
          All applications
        </Button>
        <Button variant="outline" size="sm">
          All statuses
        </Button>
        <Button className="ml-auto" size="sm">
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
            {testRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <Link
                    href={`/runs/${run.id}`}
                    className="font-medium hover:underline"
                  >
                    {run.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {run.application}
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
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/runs/${run.id}`} />}
                    aria-label={`Open ${run.name}`}
                  >
                    <ArrowRightIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
