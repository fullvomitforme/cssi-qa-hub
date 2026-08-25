import type { Metadata } from "next"

import { PlanList } from "@/components/features/plans/plan-list"

export const metadata: Metadata = { title: "Test Plans" }

export default function PlansPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Test Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define reusable QA scope, ownership, and completion targets.
        </p>
      </div>
      <PlanList />
    </main>
  )
}
