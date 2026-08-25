import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Portal Regression — v1.9.0" }

export default function RunExecutionPage() {
  return (
    <main className="min-w-0">
      <div className="flex flex-wrap items-start gap-3 border-b px-4 py-3 lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/runs" />}
          aria-label="Back to test runs"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Portal Regression — v1.9.0</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">UAT</Badge>
            <span>
              Build <span className="font-mono text-foreground">8fa2c91</span>
            </span>
            <span>Release v1.9.0</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="size-3" />
              Aug 24–26, 2026
            </span>
            <span>QA: Andi Pratama</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            Run history
          </Button>
          <Button size="sm">Complete run</Button>
        </div>
      </div>
      <ExecutionWorkspace />
    </main>
  )
}
