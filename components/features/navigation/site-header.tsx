import { GlobalCommand } from "@/components/features/navigation/global-command"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium">Quality Assurance</span>
      <div className="ml-auto hidden sm:block">
        <GlobalCommand />
      </div>
    </header>
  )
}
