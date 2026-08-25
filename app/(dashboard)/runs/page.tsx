import type { Metadata } from "next"

import { RunList } from "@/components/features/runs/run-list"

export const metadata: Metadata = { title: "Test Runs" }

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string | string[] }>
}) {
  const query = await searchParams
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Test Runs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track active execution cycles, builds, and release readiness.
        </p>
      </div>
      <RunList initialCreateOpen={query.create === "true"} />
    </main>
  )
}
