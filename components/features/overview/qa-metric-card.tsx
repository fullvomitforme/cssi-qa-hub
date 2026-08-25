import {
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleXIcon,
  FileCheck2Icon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { OverviewMetric } from "@/types/qa"

const icons = {
  "Total Scenarios": FileCheck2Icon,
  Tested: CircleDotDashedIcon,
  Passed: CircleCheckIcon,
  Failed: CircleXIcon,
  Blocked: BanIcon,
  "Not Tested": CircleDashedIcon,
} as const

const tones = {
  default: "text-foreground",
  success: "text-success-text",
  destructive: "text-destructive",
  warning: "text-warning-text",
  neutral: "text-muted-foreground",
} as const

export function QAMetricCard({ metric }: { metric: OverviewMetric }) {
  const Icon = icons[metric.label as keyof typeof icons]
  return (
    <Card size="sm">
      <CardContent className="flex min-h-24 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {metric.value.toLocaleString()}
          </p>
          <p className={cn("mt-1 text-xs", tones[metric.tone])}>
            {metric.context}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
            tones[metric.tone]
          )}
        >
          <Icon aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}
