import type { Metadata } from "next"
import { MembersList } from "@/components/features/management/management-lists"
export const metadata: Metadata = { title: "QA Members" }
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const query = await searchParams

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">QA Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage QA roles, current workload, and product assignments.
        </p>
      </div>
      <MembersList initialCreateOpen={query.invite === "true"} />
    </main>
  )
}
