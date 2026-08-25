import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { z } from "zod"

import { ScenarioFilters } from "@/components/features/scenarios/scenario-filters"
import { ScenarioTable } from "@/components/features/scenarios/scenario-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { listScenarios } from "@/services/scenarios"
import { requireUser } from "@/services/auth"
import type { Priority, TestType } from "@/types/qa"

export const metadata: Metadata = { title: "Test Scenarios" }

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  application: z
    .enum(["portal", "crm", "flowra", "daily-operation", "itqm", "intranet"])
    .optional(),
  type: z
    .enum([
      "HAPPY_PATH",
      "VALIDATION",
      "NEGATIVE",
      "PERMISSION",
      "EDGE_CASE",
      "INTEGRATION",
      "REGRESSION",
      "RESPONSIVE",
      "ACCESSIBILITY",
      "PERFORMANCE",
    ])
    .optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const parsed = querySchema.safeParse({
    search:
      typeof raw.search === "string" && raw.search ? raw.search : undefined,
    application:
      typeof raw.application === "string" && raw.application
        ? raw.application
        : undefined,
    type: typeof raw.type === "string" && raw.type ? raw.type : undefined,
    priority:
      typeof raw.priority === "string" && raw.priority
        ? raw.priority
        : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  })
  const query = parsed.success ? parsed.data : querySchema.parse({})
  const [profile, result] = await Promise.all([
    requireUser(),
    listScenarios({
      ...query,
      type: query.type as TestType | undefined,
      priority: query.priority as Priority | undefined,
      pageSize: 25,
    }),
  ])
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize))

  const pageHref = (page: number) => {
    const params = new URLSearchParams()
    if (query.search) params.set("search", query.search)
    if (query.application) params.set("application", query.application)
    if (query.type) params.set("type", query.type)
    if (query.priority) params.set("priority", query.priority)
    params.set("page", String(page))
    return `/scenarios?${params.toString()}`
  }

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Test Scenarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable test definitions across all six applications.
          </p>
        </div>
        {profile.role !== "QA_TESTER" ? (
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            New Scenario
          </Button>
        ) : null}
      </div>
      <Card className="min-w-0">
        <ScenarioFilters values={query} />
        <CardContent className="px-0">
          <ScenarioTable scenarios={result.items} />
        </CardContent>
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>{result.total.toLocaleString()} scenarios</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              render={<Link href={pageHref(Math.max(1, query.page - 1))} />}
              disabled={query.page <= 1}
            >
              Previous
            </Button>
            <span>
              Page {query.page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="xs"
              render={
                <Link href={pageHref(Math.min(pageCount, query.page + 1))} />
              }
              disabled={query.page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
}
