import type { Metadata } from "next"
import { EnvironmentsList } from "@/components/features/management/management-lists"
export const metadata: Metadata = { title: "Environments" }
export default function EnvironmentsPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Environments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review QA targets, access level, and availability across the delivery
          pipeline.
        </p>
      </div>
      <EnvironmentsList />
    </main>
  )
}
