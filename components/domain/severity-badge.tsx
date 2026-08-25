import { Badge } from "@/components/ui/badge"
import type { TopFailure } from "@/types/qa"

const variants = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "neutral",
} as const

export function SeverityBadge({
  severity,
}: {
  severity: TopFailure["severity"]
}) {
  return <Badge variant={variants[severity]}>{severity}</Badge>
}
