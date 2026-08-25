"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { updatePlanAction } from "@/app/actions/plans"
import { PlanFormSheet } from "@/components/features/plans/plan-form-sheet"
import { Button } from "@/components/ui/button"
import type {
  PlanFormValues,
  PlanReferences,
  ScenarioHierarchy,
  UserRole,
} from "@/types/qa"

export function PlanEditor({
  initialValues,
  planId,
  references,
  role,
  scenarioHierarchy,
}: {
  initialValues: PlanFormValues
  planId: string
  references: PlanReferences
  role: UserRole
  scenarioHierarchy: ScenarioHierarchy
}) {
  const [open, setOpen] = useState(false)

  if (role === "QA_TESTER") {
    return null
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon data-icon="inline-start" />
        Edit Plan
      </Button>
      <PlanFormSheet
        action={updatePlanAction}
        description="Update plan scope, assignees, status, and target dates."
        initialValues={initialValues}
        onOpenChange={setOpen}
        onSuccess={() => setOpen(false)}
        open={open}
        planId={planId}
        references={references}
        scenarioHierarchy={scenarioHierarchy}
        submitLabel="Save changes"
        title="Edit Test Plan"
      />
    </>
  )
}
