"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardXIcon } from "lucide-react"

import { PriorityBadge } from "@/components/domain/priority-badge"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ScenarioSummary } from "@/types/qa"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLocaleLowerCase())
    .join(" ")
}

export function ScenarioTable({ scenarios }: { scenarios: ScenarioSummary[] }) {
  const [selected, setSelected] = useState<ScenarioSummary | null>(null)
  if (scenarios.length === 0) {
    return (
      <Empty className="min-h-72 rounded-none border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardXIcon />
          </EmptyMedia>
          <EmptyTitle>No scenarios match these filters</EmptyTitle>
          <EmptyDescription>
            Clear one or more filters, or search for a different scenario.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-background">
            <TableHead>Scenario</TableHead>
            <TableHead>Application</TableHead>
            <TableHead>Module / Feature</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Steps</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((scenario) => (
            <TableRow
              key={scenario.id}
              className={selected?.id === scenario.id ? "bg-accent" : undefined}
            >
              <TableCell className="max-w-80 whitespace-normal">
                <button
                  type="button"
                  onClick={() => setSelected(scenario)}
                  className="text-left font-medium hover:underline"
                >
                  {scenario.title}
                </button>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {scenario.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {scenario.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{scenario.application}</TableCell>
              <TableCell>
                <span>{scenario.module}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="text-muted-foreground">
                  {scenario.feature}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{formatType(scenario.type)}</Badge>
              </TableCell>
              <TableCell>
                <PriorityBadge priority={scenario.priority} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {scenario.stepCount}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(new Date(scenario.updatedAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{selected.application}</Badge>
                  <PriorityBadge priority={selected.priority} />
                  <Badge variant="neutral">{formatType(selected.type)}</Badge>
                </div>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {selected.module} / {selected.feature}
                </SheetDescription>
              </SheetHeader>
              <div className="qa-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Description
                  </h3>
                  <p className="mt-2 text-sm leading-6">
                    {selected.description}
                  </p>
                </section>
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Tags
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
                <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Test steps
                    </dt>
                    <dd className="mt-1 font-medium">{selected.stepCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Last updated
                    </dt>
                    <dd className="mt-1 font-medium">
                      {dateFormatter.format(new Date(selected.updatedAt))}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/scenarios/${selected.id}`}
                  className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-accent"
                >
                  Open full scenario
                </Link>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
