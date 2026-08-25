import {
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  CircleXIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ExecutionStatus } from "@/types/qa"

const statusConfig = {
  PASS: { label: "Passed", variant: "success", icon: CircleCheckIcon },
  FAIL: { label: "Failed", variant: "destructive", icon: CircleXIcon },
  BLOCKED: { label: "Blocked", variant: "warning", icon: BanIcon },
  SKIPPED: { label: "Skipped", variant: "neutral", icon: CircleMinusIcon },
  NOT_TESTED: {
    label: "Not Tested",
    variant: "neutral",
    icon: CircleDashedIcon,
  },
} as const

export function TestStatusBadge({ status }: { status: ExecutionStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant}>
      <config.icon data-icon="inline-start" aria-hidden="true" />
      {config.label}
    </Badge>
  )
}
