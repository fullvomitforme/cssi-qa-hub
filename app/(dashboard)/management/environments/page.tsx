import type { Metadata } from "next"
import { EnvironmentsList } from "@/components/features/management/management-lists"
import { requireUser } from "@/services/auth"
import { listEnvironments } from "@/services/reference-data"
export const metadata: Metadata = { title: "Environments" }
export default async function EnvironmentsPage() {
  const [profile, items] = await Promise.all([
    requireUser(),
    listEnvironments(),
  ])

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Environments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review QA targets, access level, and availability across the delivery
          pipeline.
        </p>
      </div>
      <EnvironmentsList
        initialItems={items}
        canManage={profile.role === "ADMIN"}
      />
    </main>
  )
}
