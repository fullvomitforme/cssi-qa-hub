"use client"

import { useState } from "react"
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

const sections = [
  { label: "General", icon: PaletteIcon, available: true },
  { label: "Roles & permissions", icon: ShieldIcon, available: false },
  { label: "Authentication", icon: KeyRoundIcon, available: false },
  { label: "Notifications", icon: BellIcon, available: false },
  { label: "Data & evidence", icon: DatabaseIcon, available: false },
] as const

export function SettingsWorkspace() {
  const [workspaceName, setWorkspaceName] = useState("QA Hub")
  const [release, setRelease] = useState("v1.9.0")
  const [environment, setEnvironment] = useState("UAT")
  const [saved, setSaved] = useState(false)

  return (
    <div className="grid min-h-[calc(100vh-9rem)] md:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="border-r p-2" aria-label="Settings sections">
        {sections.map((section) =>
          section.available ? (
            <div
              key={section.label}
              aria-current="page"
              className="flex h-9 w-full items-center gap-2 rounded-md bg-accent px-2 text-sm font-medium"
            >
              <section.icon className="size-4 text-muted-foreground" />
              {section.label}
            </div>
          ) : (
            <button
              type="button"
              key={section.label}
              disabled
              title="Available after backend integration"
              className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md px-2 text-sm opacity-55"
            >
              <section.icon className="size-4 text-muted-foreground" />
              {section.label}
              <span className="ml-auto text-[10px] text-muted-foreground">
                Later
              </span>
            </button>
          )
        )}
      </nav>
      <section className="max-w-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">General settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspace identity and default QA selection.
            </p>
          </div>
          <Badge variant="info">Local preview</Badge>
        </div>
        <Separator className="my-5" />
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(true)
          }}
          onChange={() => setSaved(false)}
        >
          <label className="block max-w-md text-sm font-medium">
            Workspace name
            <Input
              className="mt-1.5"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </label>
          <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Default release
              <Input
                className="mt-1.5"
                value={release}
                onChange={(event) => setRelease(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Default environment
              <Input
                className="mt-1.5"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
              />
            </label>
          </div>
          <div className="flex max-w-xl items-start gap-3 rounded-lg border p-3 opacity-65">
            <input type="checkbox" checked readOnly disabled className="mt-1" />
            <span>
              <span className="block text-sm font-medium">
                Require failure details
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Enabled for demo execution. Policy configuration is coming with
                backend integration.
              </span>
            </span>
          </div>
          <div className="flex max-w-xl items-start gap-3 rounded-lg border p-3 opacity-65">
            <input type="checkbox" checked readOnly disabled className="mt-1" />
            <span>
              <span className="block text-sm font-medium">
                Show coverage separately
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Fixed in demo mode. Workspace policy configuration is coming
                later.
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm">
              Save locally
            </Button>
            {saved && (
              <span className="text-xs text-emerald-600">
                Draft retained while this page is open; defaults are not applied
                globally.
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
