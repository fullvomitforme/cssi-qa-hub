import type { Metadata } from "next"
import { ApplicationsList } from "@/components/features/management/management-lists"
export const metadata: Metadata = { title: "Applications" }
export default function ApplicationsPage() {
  return (
    <ManagementPage
      title="Applications"
      description="Manage QA scope and scenario coverage across KBVS products."
    >
      <ApplicationsList />
    </ManagementPage>
  )
}
function ManagementPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </main>
  )
}
