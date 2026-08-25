import type { Metadata } from "next"
import { z } from "zod"

import { PlanList } from "@/components/features/plans/plan-list"
import { shouldUseDemoData } from "@/lib/env"
import { requireUser } from "@/services/auth"
import { listPlans, listPlanReferences } from "@/services/plans"
import { listScenarioHierarchy } from "@/services/scenarios"

export const metadata: Metadata = { title: "Test Plans" }

const querySchema = z.object({
  create: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  status: z
    .enum(["DRAFT", "READY", "ACTIVE", "COMPLETED", "ARCHIVED"])
    .optional(),
})

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const parsed = querySchema.safeParse({
    create: typeof raw.create === "string" ? raw.create : undefined,
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
  })
  const query = parsed.success ? parsed.data : querySchema.parse({})
  const [profile, plans, references, scenarioHierarchy] = await Promise.all([
    requireUser(),
    listPlans({
      search: query.search,
      status: query.status,
    }),
    listPlanReferences(),
    listScenarioHierarchy(),
  ])

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Test Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define reusable QA scope, ownership, and completion targets.
        </p>
      </div>
      <PlanList
        canManage={profile.role !== "QA_TESTER"}
        filters={{ search: query.search, status: query.status }}
        initialCreateOpen={query.create === "true"}
        initialPlans={plans}
        isDemoMode={shouldUseDemoData()}
        references={references}
        scenarioHierarchy={scenarioHierarchy}
      />
    </main>
  )
}
