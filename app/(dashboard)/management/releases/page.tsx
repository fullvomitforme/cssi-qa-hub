import type { Metadata } from "next"
import { ReleasesList } from "@/components/features/management/management-lists"
import { requireUser } from "@/services/auth"
import { listReleases } from "@/services/reference-data"
import { shouldUseDemoData } from "@/lib/env"
export const metadata: Metadata = { title: "Releases" }
export default async function ReleasesPage() {
  const [profile, items] = await Promise.all([requireUser(), listReleases()])

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Releases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track builds, environments, and QA approval status for each
          application.
        </p>
      </div>
      <ReleasesList
        initialItems={items}
        canManage={profile.role === "ADMIN"}
        mode={shouldUseDemoData() ? "demo" : "real"}
      />
    </main>
  )
}
