import { AppSidebar } from "@/components/features/navigation/app-sidebar"
import { SiteHeader } from "@/components/features/navigation/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUser } from "@/services/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireUser()

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset className="min-w-0 bg-background">
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
