"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { updateScenarioAction } from "@/app/actions/scenarios"
import { ScenarioFormSheet } from "@/components/features/scenarios/scenario-form-sheet"
import { Button } from "@/components/ui/button"
import type {
  ScenarioFormValues,
  ScenarioHierarchy,
  UserRole,
} from "@/types/qa"

export function ScenarioEditor({
  hierarchy,
  initialValues,
  role,
  scenarioId,
}: {
  hierarchy: ScenarioHierarchy
  initialValues: ScenarioFormValues | null
  role: UserRole
  scenarioId: string
}) {
  const [open, setOpen] = useState(false)

  if (role === "QA_TESTER" || !initialValues) {
    return null
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon data-icon="inline-start" />
        Edit Scenario
      </Button>
      <ScenarioFormSheet
        action={updateScenarioAction}
        description="Update the persisted scenario definition, ordered steps, and tags."
        hierarchy={hierarchy}
        initialValues={initialValues}
        mode="edit"
        onOpenChange={setOpen}
        onSuccess={() => setOpen(false)}
        open={open}
        scenarioId={scenarioId}
        submitLabel="Save changes"
        title="Edit Test Scenario"
      />
    </>
  )
}
