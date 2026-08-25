import type { Metadata } from "next"
import { z } from "zod"

import { RunList } from "@/components/features/runs/run-list"
import { shouldUseDemoData } from "@/lib/env"
import { requireUser } from "@/services/auth"
import { listRunReferences, listRuns } from "@/services/runs"

export const metadata: Metadata = { title: "Test Runs" }

const querySchema = z.object({
  application: z.string().trim().max(120).optional(),
  create: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"])
    .optional(),
})

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const parsed = querySchema.safeParse({
    application:
      typeof raw.application === "string" ? raw.application : undefined,
    create: typeof raw.create === "string" ? raw.create : undefined,
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
  })
  const query = parsed.success ? parsed.data : querySchema.parse({})

  const [profile, runs, references] = await Promise.all([
    requireUser(),
    listRuns({
      application: query.application,
      search: query.search,
      status: query.status,
    }),
    listRunReferences(),
  ])

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Test Runs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track active execution cycles, builds, and release readiness.
        </p>
      </div>
      <RunList
        canManage={profile.role !== "QA_TESTER"}
        filters={{
          application: query.application,
          search: query.search,
          status: query.status,
        }}
        initialCreateOpen={query.create === "true"}
        initialRuns={runs}
        isDemoMode={shouldUseDemoData()}
        references={references}
      />
    </main>
  )
}
