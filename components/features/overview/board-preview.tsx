import Link from "next/link"
import { ArrowUpRightIcon, PlusIcon } from "lucide-react"

import { PriorityBadge } from "@/components/domain/priority-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { boardItems, type BoardStatus } from "@/lib/data/product-seed"

const columns: Array<{ status: BoardStatus; label: string }> = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "READY_TO_TEST", label: "Ready to Test" },
  { status: "IN_TESTING", label: "In Testing" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "FAILED_NEED_FIX", label: "Failed / Need Fix" },
]

export function BoardPreview() {
  return (
    <div className="qa-scrollbar overflow-x-auto">
      <div className="grid min-w-4xl grid-cols-5 divide-x">
        {columns.map((column) => {
          const items = boardItems
            .filter((item) => item.status === column.status)
            .slice(0, 3)
          return (
            <section key={column.status} className="min-w-0 bg-muted/30 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold">{column.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/work?item=${item.id}`}
                    className="block rounded-md border bg-background p-2 transition-colors hover:bg-accent"
                  >
                    <p className="truncate text-xs font-medium">
                      {item.application} — {item.title}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {item.scenarios} scenarios
                      </span>
                      <span className="ml-auto">
                        <PriorityBadge priority={item.priority} />
                      </span>
                      <Avatar size="sm" className="size-5">
                        <AvatarFallback>{item.assignee[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="xs"
                  className="w-full justify-start text-muted-foreground"
                  render={<Link href="/work?create=true" />}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add card
                </Button>
              </div>
            </section>
          )
        })}
      </div>
      <div className="border-t p-2">
        <Button variant="outline" size="xs" render={<Link href="/work" />}>
          View full board
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
