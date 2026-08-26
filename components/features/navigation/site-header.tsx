import Image from "next/image"

import { GlobalCommand } from "@/components/features/navigation/global-command"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <Image
        src="/kb_valbury_logo.png"
        alt="KB Valbury"
        width={24}
        height={24}
        className="h-6 w-auto"
      />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium text-muted-foreground">
        Quality Assurance
      </span>
      <div className="ml-auto hidden sm:block">
        <GlobalCommand />
      </div>
    </header>
  )
}
