"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { ScenarioFilters } from "@/components/features/scenarios/scenario-filters"
import { ScenarioTable } from "@/components/features/scenarios/scenario-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Priority, ScenarioSummary, TestType } from "@/types/qa"

const applicationSlugs: Record<string, string> = {
  Portal: "portal",
  CRM: "crm",
  Flowra: "flowra",
  "Daily Operation": "daily-operation",
  ITQM: "itqm",
  Intranet: "intranet",
}

const testTypes: TestType[] = [
  "HAPPY_PATH",
  "VALIDATION",
  "NEGATIVE",
  "PERMISSION",
  "EDGE_CASE",
  "INTEGRATION",
  "REGRESSION",
  "RESPONSIVE",
  "ACCESSIBILITY",
  "PERFORMANCE",
]

type FilterValues = {
  search?: string
  application?: string
  module?: string
  feature?: string
  type?: string
  priority?: string
  updated?: string
}

export function ScenarioWorkspace({
  initialScenarios,
  initialTotal,
  page,
  pageCount,
  previousHref,
  nextHref,
  filters,
  modules,
  features,
  canCreate,
  initialCreateOpen,
}: {
  initialScenarios: ScenarioSummary[]
  initialTotal: number
  page: number
  pageCount: number
  previousHref: string
  nextHref: string
  filters: FilterValues
  modules: string[]
  features: string[]
  canCreate: boolean
  initialCreateOpen: boolean
}) {
  const [scenarios, setScenarios] = useState(initialScenarios)
  const [createdCount, setCreatedCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)

  function createScenario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const application = String(form.get("application"))
    const tags = String(form.get("tags"))
      .split(",")
      .map((tag) => tag.trim().toLocaleLowerCase())
      .filter(Boolean)
    const scenario: ScenarioSummary = {
      id: `local-scenario-${Date.now()}`,
      application,
      applicationSlug: applicationSlugs[application],
      module: String(form.get("module")),
      feature: String(form.get("feature")),
      title: String(form.get("title")),
      description: String(form.get("description")),
      priority: String(form.get("priority")) as Priority,
      type: String(form.get("type")) as TestType,
      tags,
      stepCount: Number(form.get("stepCount")) || 1,
      updatedAt: new Date().toISOString(),
    }
    setScenarios((current) => [scenario, ...current])
    setCreatedCount((count) => count + 1)
    setCreateOpen(false)
  }

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Test Scenarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable test definitions across all six applications.
          </p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New Scenario
          </Button>
        ) : null}
      </div>
      <Card className="min-w-0">
        <ScenarioFilters
          values={filters}
          modules={modules}
          features={features}
        />
        <CardContent className="px-0">
          <ScenarioTable scenarios={scenarios} />
        </CardContent>
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            {(initialTotal + createdCount).toLocaleString()} scenarios
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              render={<Link href={previousHref} />}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="xs"
              render={<Link href={nextHref} />}
              disabled={page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>New Test Scenario</SheetTitle>
            <SheetDescription>
              Add a local scenario draft to the current table.
            </SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col" onSubmit={createScenario}>
            <div className="qa-scrollbar grid flex-1 gap-4 overflow-y-auto p-4">
              <label className="text-sm font-medium">
                Scenario title
                <Input name="title" className="mt-1.5" required />
              </label>
              <label className="text-sm font-medium">
                Description
                <Textarea name="description" className="mt-1.5" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Application
                  <select
                    name="application"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {Object.keys(applicationSlugs).map((application) => (
                      <option key={application}>{application}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Priority
                  <select
                    name="priority"
                    defaultValue="P2"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {(["P0", "P1", "P2", "P3"] as const).map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Module
                  <Input name="module" className="mt-1.5" required />
                </label>
                <label className="text-sm font-medium">
                  Feature
                  <Input name="feature" className="mt-1.5" required />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Test type
                  <select
                    name="type"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {testTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Step count
                  <Input
                    name="stepCount"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className="mt-1.5"
                    required
                  />
                </label>
              </div>
              <label className="text-sm font-medium">
                Tags
                <Input
                  name="tags"
                  className="mt-1.5"
                  placeholder="smoke, regression"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Local drafts remain in this browser session and are not
                persisted.
              </p>
            </div>
            <SheetFooter className="border-t">
              <Button type="submit">Create local scenario</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
