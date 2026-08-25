import type { Metadata } from "next"
import { MembersList } from "@/components/features/management/management-lists"
import { shouldUseDemoData } from "@/lib/env"
import { listMemberRecords } from "@/services/management"
import { requireUser } from "@/services/auth"
export const metadata: Metadata = { title: "QA Members" }
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const query = await searchParams
  const profile = await requireUser()
  if (profile.role !== "ADMIN") {
    const { redirect } = await import("next/navigation")
    redirect("/overview")
  }
  const records =
    shouldUseDemoData() || profile.role !== "ADMIN"
      ? undefined
      : await listMemberRecords()
  const items = records?.map((item) => ({
    id: item.id,
    name: item.full_name,
    email: item.email,
    role: item.role,
    assignments: 0,
    activeRuns: 0,
    lastActive:
      item.last_sign_in_at ??
      item.email_confirmed_at ??
      "Awaiting first sign-in",
    status: item.status,
    invitationPending: item.invitation_pending,
  }))

  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">QA Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage QA roles, current workload, and product assignments.
        </p>
      </div>
      <MembersList
        initialCreateOpen={query.invite === "true"}
        initialItems={items}
        mode={shouldUseDemoData() ? "demo" : "real"}
      />
    </main>
  )
}
