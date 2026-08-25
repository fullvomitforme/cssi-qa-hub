import { SeverityBadge } from "@/components/domain/severity-badge"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TopFailure } from "@/types/qa"

export function TopFailuresTable({ failures }: { failures: TopFailure[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-background">
          <TableHead>Scenario</TableHead>
          <TableHead>Application</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Bug Reference</TableHead>
          <TableHead>Found By</TableHead>
          <TableHead>Found At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {failures.map((failure) => (
          <TableRow key={failure.id}>
            <TableCell className="font-medium">{failure.scenario}</TableCell>
            <TableCell>{failure.application}</TableCell>
            <TableCell>
              <Badge variant="destructive">Failed</Badge>
            </TableCell>
            <TableCell>
              <SeverityBadge severity={failure.severity} />
            </TableCell>
            <TableCell className="font-medium">
              {failure.bugReference}
            </TableCell>
            <TableCell>{failure.foundBy}</TableCell>
            <TableCell className="text-muted-foreground">
              {failure.foundAt}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
