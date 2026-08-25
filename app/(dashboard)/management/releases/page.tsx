import type { Metadata } from "next"
import { ReleasesList } from "@/components/features/management/management-lists"
export const metadata: Metadata = { title: "Releases" }
export default function ReleasesPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Releases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track builds, environments, and QA approval status for each
          application.
        </p>
      </div>
      <ReleasesList />
    </main>
  )
}
