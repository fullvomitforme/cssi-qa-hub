import type { Metadata } from "next"
import { SettingsWorkspace } from "@/components/features/settings/settings-workspace"

export const metadata: Metadata = { title: "Settings" }
export default function SettingsPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure QA Hub defaults and governance controls.
        </p>
      </div>
      <SettingsWorkspace />
    </main>
  )
}
