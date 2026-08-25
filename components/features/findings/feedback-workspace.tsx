"use client"

import { useState } from "react"
import {
  BugIcon,
  CircleHelpIcon,
  LightbulbIcon,
  MessageSquareTextIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"

import { TestStatusBadge } from "@/components/domain/test-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { feedbackItems } from "@/lib/data/product-seed"
import type { ExecutionStatus } from "@/types/qa"

const icons = {
  BUG: BugIcon,
  UX: SparklesIcon,
  COPY: MessageSquareTextIcon,
  IMPROVEMENT: LightbulbIcon,
  QUESTION: CircleHelpIcon,
} as const

export function FeedbackWorkspace() {
  const [selectedId, setSelectedId] = useState<string>(feedbackItems[0].id)
  const selected =
    feedbackItems.find((item) => item.id === selectedId) ?? feedbackItems[0]
  const Icon = icons[selected.type]
  return (
    <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 border-r">
        <div className="flex items-center gap-2 border-b p-3">
          <div className="relative max-w-80 flex-1">
            <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search feedback…" className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            All types
          </Button>
          <Button size="sm">New feedback</Button>
        </div>
        <div className="divide-y">
          {feedbackItems.map((item) => {
            const ItemIcon = icons[item.type]
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left hover:bg-accent ${item.id === selectedId ? "bg-accent" : ""}`}
              >
                <span className="flex size-8 items-center justify-center rounded-md border bg-background">
                  <ItemIcon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <Badge variant="outline">{item.type}</Badge>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {item.application} · {item.scenario} · {item.author}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.createdAt.split(", 2026 ")[0]}
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <aside className="min-w-0 bg-background">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md border">
              <Icon className="size-4" />
            </span>
            <Badge variant="outline">{selected.type}</Badge>
            <Badge variant={selected.status === "OPEN" ? "warning" : "neutral"}>
              {selected.status.replace("_", " ")}
            </Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold">{selected.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {selected.description}
          </p>
        </div>
        <div className="space-y-5 p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Application</dt>
              <dd className="mt-1 font-medium">{selected.application}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Severity</dt>
              <dd className="mt-1">{selected.severity}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Scenario</dt>
              <dd className="mt-1">{selected.scenario}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Execution result
              </dt>
              <dd className="mt-1">
                <TestStatusBadge
                  status={selected.executionStatus as ExecutionStatus}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created by</dt>
              <dd className="mt-1">{selected.author}</dd>
            </div>
          </dl>
          <div className="border-t pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Discussion
            </h3>
            <div className="mt-3 rounded-md border p-3">
              <p className="text-sm">
                Thanks—product review is scheduled for the release readiness
                meeting.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Andi Pratama · 24 minutes ago
              </p>
            </div>
            <Input className="mt-2" placeholder="Add a comment…" />
          </div>
        </div>
      </aside>
    </div>
  )
}
