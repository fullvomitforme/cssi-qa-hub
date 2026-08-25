import type { Metadata } from "next"
import { z } from "zod"

import { ScenarioWorkspace } from "@/components/features/scenarios/scenario-workspace"
import { scenarioSeed } from "@/lib/data/seed"
import { listScenarios } from "@/services/scenarios"
import { requireUser } from "@/services/auth"
import type { Priority, TestType } from "@/types/qa"

export const metadata: Metadata = { title: "Test Scenarios" }

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  application: z
    .enum(["portal", "crm", "flowra", "daily-operation", "itqm", "intranet"])
    .optional(),
  module: z.string().trim().max(80).optional(),
  feature: z.string().trim().max(80).optional(),
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
  updated: z.enum(["3d", "7d", "30d"]).optional(),
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
    module:
      typeof raw.module === "string" && raw.module ? raw.module : undefined,
    feature:
      typeof raw.feature === "string" && raw.feature ? raw.feature : undefined,
    type: typeof raw.type === "string" && raw.type ? raw.type : undefined,
    priority:
      typeof raw.priority === "string" && raw.priority
        ? raw.priority
        : undefined,
    updated:
      typeof raw.updated === "string" && raw.updated ? raw.updated : undefined,
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
    if (query.module) params.set("module", query.module)
    if (query.feature) params.set("feature", query.feature)
    if (query.type) params.set("type", query.type)
    if (query.priority) params.set("priority", query.priority)
    if (query.updated) params.set("updated", query.updated)
    params.set("page", String(page))
    return `/scenarios?${params.toString()}`
  }

  return (
    <ScenarioWorkspace
      initialScenarios={result.items}
      initialTotal={result.total}
      page={query.page}
      pageCount={pageCount}
      previousHref={pageHref(Math.max(1, query.page - 1))}
      nextHref={pageHref(Math.min(pageCount, query.page + 1))}
      filters={query}
      modules={Array.from(
        new Set(scenarioSeed.map((item) => item.module))
      ).sort()}
      features={Array.from(
        new Set(scenarioSeed.map((item) => item.feature))
      ).sort()}
      canCreate={profile.role !== "QA_TESTER"}
      initialCreateOpen={raw.create === "true"}
    />
  )
}
