import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { RecentRun } from "@/types/qa"

const variants = {
  IN_PROGRESS: "info",
  BLOCKED: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
} as const

export function RecentTestRuns({ runs }: { runs: RecentRun[] }) {
  return (
    <div className="divide-y">
      {runs.map((run) => (
        <Link
          key={run.id}
          href={`/runs/${run.id}`}
          className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{run.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {run.environment} • Build {run.build}
            </p>
          </div>
          <Badge variant={variants[run.status]}>
            {run.status.replace("_", " ")}
          </Badge>
          <span className="w-9 text-right text-xs tabular-nums">
            {run.progress}%
          </span>
        </Link>
      ))}
    </div>
  )
}
