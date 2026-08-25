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
import { createCommentAction } from "@/app/actions/findings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { feedbackItems } from "@/lib/data/product-seed"
import type { FeedbackListItem } from "@/services/findings"
import type { ExecutionStatus } from "@/types/qa"

const icons = {
  BUG: BugIcon,
  UX: SparklesIcon,
  COPY: MessageSquareTextIcon,
  IMPROVEMENT: LightbulbIcon,
  QUESTION: CircleHelpIcon,
} as const

type FeedbackType = keyof typeof icons
type FeedbackItem = {
  id: string
  type: FeedbackType
  title: string
  description: string
  application: string
  scenario: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  status: string
  author: string
  createdAt: string
  executionStatus: ExecutionStatus
}

type Comment = {
  id: string
  body: string
  author: string
  createdAt: string
}

export function FeedbackWorkspace({
  items: realItems,
}: {
  items?: FeedbackListItem[]
}) {
  const sourceItems = realItems
    ? realItems.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        application: item.application,
        scenario: item.scenario,
        severity: item.severity ?? "LOW",
        status: item.status,
        author: item.author,
        createdAt: item.createdAt,
        executionStatus: "NOT_TESTED" as ExecutionStatus,
      }))
    : feedbackItems.map((item) => ({ ...item }))
  const [items, setItems] = useState<FeedbackItem[]>(sourceItems)
  const [selectedId, setSelectedId] = useState<string>(sourceItems[0]?.id ?? "")
  const [search, setSearch] = useState("")
  const [type, setType] = useState<FeedbackType | "ALL">("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => ({
    ...(sourceItems[0]
      ? {
          [sourceItems[0].id]: [
            {
              id: "comment-seed-1",
              body: "Thanks—product review is scheduled for the release readiness meeting.",
              author: "Andi Pratama",
              createdAt: "24 minutes ago",
            },
          ],
        }
      : {}),
  }))

  const filteredItems = items.filter((item) => {
    const needle = search.trim().toLocaleLowerCase()
    return (
      (!needle ||
        `${item.title} ${item.description} ${item.application} ${item.scenario}`
          .toLocaleLowerCase()
          .includes(needle)) &&
      (type === "ALL" || item.type === type)
    )
  })
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  if (!selected) return null
  const Icon = icons[selected.type]

  function createFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const item: FeedbackItem = {
      id: `local-feedback-${Date.now()}`,
      type: String(form.get("type")) as FeedbackType,
      title: String(form.get("title")),
      description: String(form.get("description")),
      application: String(form.get("application")),
      scenario: String(form.get("scenario")),
      severity: String(form.get("severity")) as FeedbackItem["severity"],
      status: "OPEN",
      author: "Andi Pratama",
      createdAt: "Just now",
      executionStatus: String(form.get("executionStatus")) as ExecutionStatus,
    }
    setItems((current) => [item, ...current])
    setSelectedId(item.id)
    setCreateOpen(false)
  }

  function addComment() {
    const body = commentDrafts[selected.id]?.trim()
    if (!body) return
    if (realItems) {
      void createCommentAction({
        subjectType: "FEEDBACK",
        subjectId: selected.id,
        body,
      }).then((result) => {
        if (result.status === "error") return
        setComments((current) => ({
          ...current,
          [selected.id]: [
            ...(current[selected.id] ?? []),
            {
              id: `comment-${selected.id}-${Date.now()}`,
              body,
              author: selected.author,
              createdAt: "Just now",
            },
          ],
        }))
      })
      setCommentDrafts((current) => ({ ...current, [selected.id]: "" }))
      return
    }
    setComments((current) => ({
      ...current,
      [selected.id]: [
        ...(current[selected.id] ?? []),
        {
          id: `comment-${selected.id}-${Date.now()}`,
          body,
          author: "Andi Pratama",
          createdAt: "Just now",
        },
      ],
    }))
    setCommentDrafts((current) => ({ ...current, [selected.id]: "" }))
  }

  return (
    <>
      <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 border-r">
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative max-w-80 flex-1">
              <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search feedback…"
                className="pl-8"
              />
            </div>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as FeedbackType | "ALL")
              }
              aria-label="Filter feedback by type"
              className="h-8 rounded-lg border bg-background px-2 text-sm"
            >
              <option value="ALL">All types</option>
              {(Object.keys(icons) as FeedbackType[]).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              disabled={Boolean(realItems)}
              title={
                realItems
                  ? "Create feedback from an execution workspace."
                  : undefined
              }
            >
              New feedback
            </Button>
          </div>
          {filteredItems.length ? (
            <div className="divide-y">
              {filteredItems.map((item) => {
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
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No feedback matches the current search and type filter.
            </p>
          )}
        </section>
        <aside className="min-w-0 bg-background">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md border">
                <Icon className="size-4" />
              </span>
              <Badge variant="outline">{selected.type}</Badge>
              <Badge
                variant={selected.status === "OPEN" ? "warning" : "neutral"}
              >
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
                  <TestStatusBadge status={selected.executionStatus} />
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
              <div className="mt-3 space-y-2">
                {(comments[selected.id] ?? []).map((comment) => (
                  <div key={comment.id} className="rounded-md border p-3">
                    <p className="text-sm">{comment.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {comment.author} · {comment.createdAt}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={commentDrafts[selected.id] ?? ""}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [selected.id]: event.target.value,
                    }))
                  }
                  placeholder="Add a comment…"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addComment()
                  }}
                />
                <Button
                  size="sm"
                  onClick={addComment}
                  disabled={!commentDrafts[selected.id]?.trim()}
                >
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>New Feedback</SheetTitle>
            <SheetDescription>
              Record feedback independently from the execution result.
            </SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col" onSubmit={createFeedback}>
            <div className="grid flex-1 gap-4 p-4">
              <label className="text-sm font-medium">
                Title
                <Input name="title" className="mt-1.5" required />
              </label>
              <label className="text-sm font-medium">
                Description
                <Textarea name="description" className="mt-1.5" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Type
                  <select
                    name="type"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {(Object.keys(icons) as FeedbackType[]).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Severity
                  <select
                    name="severity"
                    defaultValue="LOW"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
                      (item) => (
                        <option key={item}>{item}</option>
                      )
                    )}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Application
                  <select
                    name="application"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {[
                      "Portal",
                      "CRM",
                      "Flowra",
                      "Daily Operation",
                      "ITQM",
                      "Intranet",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Execution result
                  <select
                    name="executionStatus"
                    defaultValue="PASS"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {(
                      [
                        "PASS",
                        "FAIL",
                        "BLOCKED",
                        "SKIPPED",
                        "NOT_TESTED",
                      ] as const
                    ).map((item) => (
                      <option key={item}>{item.replace("_", " ")}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-sm font-medium">
                Scenario
                <Input name="scenario" className="mt-1.5" required />
              </label>
              <p className="text-xs text-muted-foreground">
                Passing executions may still include UX, copy, improvement, or
                question feedback.
              </p>
            </div>
            <SheetFooter className="border-t">
              <Button type="submit">Create feedback</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
