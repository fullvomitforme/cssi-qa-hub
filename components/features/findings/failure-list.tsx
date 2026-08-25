"use client"

import { useState } from "react"
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
import { failureItems } from "@/lib/data/product-seed"

type Failure = (typeof failureItems)[number]

export function FailureList() {
  const [selected, setSelected] = useState<Failure | null>(null)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative max-w-80 flex-1">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search failures…" className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          All applications
        </Button>
        <Button variant="outline" size="sm">
          Open failures
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          5 actionable findings
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
            {failureItems.map((failure) => (
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
                    <li>
                      <p className="text-sm font-medium">
                        Attempt 2 · {selected.retestStatus.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Build 8fb13aa · Aug 26, 09:42
                      </p>
                    </li>
                    <li>
                      <p className="text-sm font-medium">Attempt 1 · Failed</p>
                      <p className="text-xs text-muted-foreground">
                        Build 8fa2c91 · {selected.foundAt}
                      </p>
                    </li>
                  </ol>
                </section>
                <Button variant="outline" size="sm">
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
