"use client"

import { useMemo, useState } from "react"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  GripVerticalIcon,
  SearchIcon,
} from "lucide-react"

import { PriorityBadge } from "@/components/domain/priority-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  boardItems as initialBoardItems,
  boardStatuses,
  type BoardItem,
  type BoardStatus,
} from "@/lib/data/product-seed"

const labels: Record<BoardStatus, string> = {
  BACKLOG: "Backlog",
  READY_TO_TEST: "Ready to Test",
  IN_TESTING: "In Testing",
  BLOCKED: "Blocked",
  FAILED_NEED_FIX: "Failed / Need Fix",
  RETEST: "Retest",
  PASSED: "Passed",
  DONE: "Done",
}

function WorkItemCard({
  item,
  onOpen,
  onDragStart,
}: {
  item: BoardItem
  onOpen: () => void
  onDragStart: () => void
}) {
  const executed = item.passed + item.failed + item.blocked
  const progress = item.scenarios
    ? Math.round((executed / item.scenarios) * 100)
    : 0

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className="group relative rounded-md border bg-background p-2.5 transition-colors hover:border-foreground/20 hover:bg-accent"
    >
      <button
        type="button"
        aria-label={`Open ${item.application} ${item.title}`}
        onClick={onOpen}
        className="absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <div className="flex items-start gap-1">
        <GripVerticalIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">
            {item.application} — {item.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.feature}
          </p>
        </div>
        <PriorityBadge priority={item.priority} />
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1 text-center text-xs tabular-nums">
        <span className="text-success-text">{item.passed} P</span>
        <span className="text-destructive">{item.failed} F</span>
        <span className="text-warning-text">{item.blocked} B</span>
        <span className="text-muted-foreground">{item.untested} U</span>
      </div>
      <Progress
        value={progress}
        className="mt-2"
        aria-label={`${progress}% executed`}
      />
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{item.scenarios} scenarios</span>
        <span className="ml-auto">{item.due}</span>
        <Avatar size="sm" className="size-5">
          <AvatarFallback>{item.assignee[0]}</AvatarFallback>
        </Avatar>
      </div>
    </article>
  )
}

export function QABoard({
  initialItemId,
  initialCreateOpen = false,
}: {
  initialItemId?: string
  initialCreateOpen?: boolean
}) {
  const [items, setItems] = useState<BoardItem[]>(initialBoardItems)
  const [selected, setSelected] = useState<BoardItem | null>(
    () => initialBoardItems.find((item) => item.id === initialItemId) ?? null
  )
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [application, setApplication] = useState("all")
  const [priority, setPriority] = useState("all")

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const needle = search.toLocaleLowerCase()
        return (
          (!needle ||
            `${item.application} ${item.title} ${item.feature}`
              .toLocaleLowerCase()
              .includes(needle)) &&
          (application === "all" || item.application === application) &&
          (priority === "all" || item.priority === priority)
        )
      }),
    [application, items, priority, search]
  )

  function moveItem(id: string, status: BoardStatus) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    )
    setSelected((current) =>
      current?.id === id ? { ...current, status } : current
    )
  }

  function createWorkItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const scenarioCount = Number(form.get("scenarios")) || 1
    const item: BoardItem = {
      id: `work-${Date.now()}`,
      title: String(form.get("title")),
      application: String(form.get("application")),
      feature: String(form.get("feature")),
      release: "v1.9.0",
      environment: "UAT",
      priority: String(form.get("priority")) as BoardItem["priority"],
      assignee: String(form.get("assignee")),
      due: String(form.get("due")),
      scenarios: scenarioCount,
      passed: 0,
      failed: 0,
      blocked: 0,
      untested: scenarioCount,
      status: "BACKLOG",
    }
    setItems((current) => [item, ...current])
    setCreateOpen(false)
    setSelected(item)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b bg-background p-3">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search QA work…"
            className="pl-8"
          />
        </div>
        <Select
          value={application}
          onValueChange={(value) => setApplication(value ?? "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Application" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All applications</SelectItem>
            {[
              "Portal",
              "CRM",
              "Flowra",
              "Daily Operation",
              "ITQM",
              "Intranet",
            ].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value ?? "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["P0", "P1", "P2", "P3"].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Add work item
        </Button>
      </div>

      <div className="qa-scrollbar overflow-x-auto">
        <div className="grid min-h-[calc(100vh-10rem)] min-w-[1540px] grid-cols-8 divide-x">
          {boardStatuses.map((status) => {
            const columnItems = filteredItems.filter(
              (item) => item.status === status
            )
            return (
              <section
                key={status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) moveItem(draggedId, status)
                  setDraggedId(null)
                }}
                className="bg-muted/30 p-2"
              >
                <header className="mb-2 flex h-7 items-center gap-2 px-1">
                  <span className="size-2 rounded-full bg-muted-foreground" />
                  <h2 className="text-xs font-semibold tracking-wide uppercase">
                    {labels[status]}
                  </h2>
                  <Badge variant="neutral" className="ml-auto">
                    {columnItems.length}
                  </Badge>
                </header>
                <div className="space-y-2">
                  {columnItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      onDragStart={() => setDraggedId(item.id)}
                      onOpen={() => setSelected(item)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
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
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{selected.application}</Badge>
                  <PriorityBadge priority={selected.priority} />
                </div>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {selected.feature} · {selected.release} ·{" "}
                  {selected.environment}
                </SheetDescription>
              </SheetHeader>
              <div className="qa-scrollbar flex-1 overflow-y-auto p-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Status</dt>
                    <dd className="mt-1 font-medium">
                      {labels[selected.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Assignee</dt>
                    <dd className="mt-1 font-medium">{selected.assignee}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Release</dt>
                    <dd className="mt-1">{selected.release}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Due</dt>
                    <dd className="mt-1 flex items-center gap-1">
                      <CalendarDaysIcon className="size-3.5" />
                      {selected.due}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Execution summary
                  </h3>
                  <div className="mt-3 grid grid-cols-4 divide-x border">
                    {[
                      {
                        label: "Passed",
                        value: selected.passed,
                        icon: CheckCircle2Icon,
                        tone: "text-success-text",
                      },
                      {
                        label: "Failed",
                        value: selected.failed,
                        icon: CircleAlertIcon,
                        tone: "text-destructive",
                      },
                      {
                        label: "Blocked",
                        value: selected.blocked,
                        icon: CircleAlertIcon,
                        tone: "text-warning-text",
                      },
                      {
                        label: "Untested",
                        value: selected.untested,
                        icon: CircleAlertIcon,
                        tone: "text-muted-foreground",
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="p-3 text-center">
                        <metric.icon
                          className={`mx-auto size-4 ${metric.tone}`}
                        />
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {metric.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 border-t pt-4">
                  <label
                    className="text-xs font-semibold text-muted-foreground uppercase"
                    htmlFor="work-status"
                  >
                    Move to
                  </label>
                  <Select
                    value={selected.status}
                    onValueChange={(value) => {
                      if (value) moveItem(selected.id, value as BoardStatus)
                    }}
                  >
                    <SelectTrigger id="work-status" className="mt-2 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {boardStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {labels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Recent history
                  </h3>
                  <div className="mt-3 border-l pl-4 text-sm">
                    <p className="font-medium">
                      Ready to Test → {labels[selected.status]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Changed by {selected.assignee} · Aug 25, 10:21
                    </p>
                    <p className="mt-2 text-xs">
                      Work item status changed during this UI review session.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>Add work item</SheetTitle>
            <SheetDescription>
              Add a feature-level QA item to the backlog for this local session.
            </SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col" onSubmit={createWorkItem}>
            <div className="grid flex-1 gap-4 p-4">
              <label className="text-sm font-medium">
                Title
                <Input name="title" className="mt-1.5" required />
              </label>
              <label className="text-sm font-medium">
                Feature
                <Input name="feature" className="mt-1.5" required />
              </label>
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
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Priority
                  <select
                    name="priority"
                    defaultValue="P2"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {(["P0", "P1", "P2", "P3"] as const).map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm font-medium">
                  Assignee
                  <Input
                    name="assignee"
                    defaultValue="Andi"
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Due
                  <Input
                    name="due"
                    defaultValue="Aug 30"
                    className="mt-1.5"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Scenarios
                  <Input
                    name="scenarios"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className="mt-1.5"
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                New work starts in Backlog for release v1.9.0 on UAT.
              </p>
            </div>
            <SheetFooter className="border-t">
              <Button type="submit">Add to backlog</Button>
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
