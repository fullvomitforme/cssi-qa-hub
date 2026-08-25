import type { Metadata } from "next"
import {
  BellIcon,
  DatabaseIcon,
  KeyRoundIcon,
  PaletteIcon,
  ShieldIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Settings" }
const sections = [
  { label: "General", icon: PaletteIcon },
  { label: "Roles & permissions", icon: ShieldIcon },
  { label: "Authentication", icon: KeyRoundIcon },
  { label: "Notifications", icon: BellIcon },
  { label: "Data & evidence", icon: DatabaseIcon },
] as const
export default function SettingsPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure QA Hub defaults and governance controls.
        </p>
      </div>
      <div className="grid min-h-[calc(100vh-9rem)] md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="border-r p-2">
          {sections.map((section, index) => (
            <button
              type="button"
              key={section.label}
              className={`flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm ${index === 0 ? "bg-accent font-medium" : "hover:bg-accent"}`}
            >
              <section.icon className="size-4 text-muted-foreground" />
              {section.label}
            </button>
          ))}
        </nav>
        <section className="max-w-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">General settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Workspace identity and default QA selection.
              </p>
            </div>
            <Badge variant="info">UI preview</Badge>
          </div>
          <Separator className="my-5" />
          <div className="space-y-5">
            <label className="block max-w-md text-sm font-medium">
              Workspace name
              <Input className="mt-1.5" defaultValue="QA Hub" />
            </label>
            <div className="grid max-w-xl grid-cols-2 gap-4">
              <label className="block text-sm font-medium">
                Default release
                <Input className="mt-1.5" defaultValue="v1.9.0" />
              </label>
              <label className="block text-sm font-medium">
                Default environment
                <Input className="mt-1.5" defaultValue="UAT" />
              </label>
            </div>
            <label className="flex max-w-xl items-start gap-3 border p-3">
              <input type="checkbox" defaultChecked className="mt-1" />
              <span>
                <span className="block text-sm font-medium">
                  Require failure details
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Actual result, reason, and severity are required when marking
                  an execution failed.
                </span>
              </span>
            </label>
            <label className="flex max-w-xl items-start gap-3 border p-3">
              <input type="checkbox" defaultChecked className="mt-1" />
              <span>
                <span className="block text-sm font-medium">
                  Show coverage separately
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Never combine execution coverage and pass rate into one health
                  score.
                </span>
              </span>
            </label>
            <Button size="sm">Save settings</Button>
          </div>
        </section>
      </div>
    </main>
  )
}
