import type { Metadata } from "next"
import { FailureList } from "@/components/features/findings/failure-list"
import { shouldUseDemoData } from "@/lib/env"
import { listFailures } from "@/services/findings"

export const metadata: Metadata = { title: "Failures" }
export default async function FailuresPage() {
  const failures = shouldUseDemoData() ? undefined : await listFailures()
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Failures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Investigate failed scenarios and follow every fix through retesting.
        </p>
      </div>
      <FailureList items={failures} />
    </main>
  )
}
