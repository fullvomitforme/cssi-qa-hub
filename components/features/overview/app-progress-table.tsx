import Link from "next/link"

import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ApplicationProgress } from "@/types/qa"

export function AppProgressTable({
  applications,
}: {
  applications: ApplicationProgress[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-background">
          <TableHead>Application</TableHead>
          <TableHead>Tested</TableHead>
          <TableHead className="text-right">Pass Rate</TableHead>
          <TableHead className="text-right">Failed</TableHead>
          <TableHead className="text-right">Blocked</TableHead>
          <TableHead className="text-right">Not Tested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.slug}>
            <TableCell>
              <Link
                className="font-medium hover:underline"
                href={`/scenarios?application=${application.slug}`}
              >
                {application.application}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex min-w-36 items-center gap-2">
                <span className="w-10 text-right text-xs tabular-nums">
                  {application.coverage}%
                </span>
                <Progress
                  value={application.coverage}
                  aria-label={`${application.application} coverage`}
                />
              </div>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {application.passRate}%
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {application.failed}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {application.blocked}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {application.notTested}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
