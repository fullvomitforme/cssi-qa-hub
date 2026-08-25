"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { createScenarioAction } from "@/app/actions/scenarios"
import { ScenarioFilters } from "@/components/features/scenarios/scenario-filters"
import { ScenarioFormSheet } from "@/components/features/scenarios/scenario-form-sheet"
import { ScenarioTable } from "@/components/features/scenarios/scenario-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ScenarioHierarchy, ScenarioSummary } from "@/types/qa"

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
  canCreate,
  filters,
  hierarchy,
  initialCreateOpen,
  initialScenarios,
  initialTotal,
  isDemoMode,
  nextHref,
  page,
  pageCount,
  previousHref,
}: {
  canCreate: boolean
  filters: FilterValues
  hierarchy: ScenarioHierarchy
  initialCreateOpen: boolean
  initialScenarios: ScenarioSummary[]
  initialTotal: number
  isDemoMode: boolean
  nextHref: string
  page: number
  pageCount: number
  previousHref: string
}) {
  const [scenarios, setScenarios] = useState(initialScenarios)
  const [createdCount, setCreatedCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const [notice, setNotice] = useState<string | null>(null)

  function createLocalScenario(formValues: FormData) {
    const application = hierarchy.applications.find(
      (item) => item.id === String(formValues.get("applicationId"))
    )
    const selectedModule = hierarchy.modules.find(
      (item) => item.id === String(formValues.get("moduleId"))
    )
    const feature = hierarchy.features.find(
      (item) => item.id === String(formValues.get("featureId"))
    )

    if (!application || !selectedModule || !feature) {
      return
    }

    const steps = JSON.parse(String(formValues.get("steps") ?? "[]")) as Array<{
      instruction: string
      expectedResult: string
    }>
    const tags = JSON.parse(String(formValues.get("tags") ?? "[]")) as string[]

    const scenario: ScenarioSummary = {
      id: `local-scenario-${Date.now()}`,
      application: application.name,
      applicationSlug: application.slug,
      module: selectedModule.name,
      feature: feature.name,
      title: String(formValues.get("title") ?? ""),
      description: String(formValues.get("description") ?? ""),
      priority: String(
        formValues.get("priority")
      ) as ScenarioSummary["priority"],
      type: String(formValues.get("type")) as ScenarioSummary["type"],
      tags,
      stepCount: steps.length,
      updatedAt: new Date().toISOString(),
    }

    setScenarios((current) => [scenario, ...current])
    setCreatedCount((count) => count + 1)
    setCreateOpen(false)
    setNotice("Local demo draft created in this browser session.")
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

      {notice ? (
        <p className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      ) : null}

      <Card className="min-w-0">
        <ScenarioFilters hierarchy={hierarchy} values={filters} />
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

      {isDemoMode ? (
        <ScenarioFormSheet
          action={async (state, payload) => {
            createLocalScenario(payload)
            return {
              ...state,
              status: "success",
              message: "Local draft created.",
              scenarioId: `local-scenario-${Date.now()}`,
            }
          }}
          description="Create a local draft that exists only in this browser session."
          hierarchy={hierarchy}
          mode="create"
          onOpenChange={setCreateOpen}
          onSuccess={() => setCreateOpen(false)}
          open={createOpen}
          submitLabel="Create local scenario"
          title="New Test Scenario"
        />
      ) : (
        <ScenarioFormSheet
          action={createScenarioAction}
          description="Create a persisted scenario with ordered steps and reusable tags."
          hierarchy={hierarchy}
          mode="create"
          onOpenChange={setCreateOpen}
          onSuccess={(scenarioId) => {
            setCreateOpen(false)
            setNotice(
              `Scenario created. Open /scenarios/${scenarioId} to review details.`
            )
          }}
          open={createOpen}
          submitLabel="Create scenario"
          title="New Test Scenario"
        />
      )}
    </main>
  )
}
