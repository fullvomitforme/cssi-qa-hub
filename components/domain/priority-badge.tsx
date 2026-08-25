import { Badge } from "@/components/ui/badge"
import type { Priority } from "@/types/qa"

const variants = {
  P0: "destructive",
  P1: "warning",
  P2: "info",
  P3: "neutral",
} as const

const labels = {
  P0: "P0 Critical",
  P1: "P1 High",
  P2: "P2 Medium",
  P3: "P3 Low",
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
}
