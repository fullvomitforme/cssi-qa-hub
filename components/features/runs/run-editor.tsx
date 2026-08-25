"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { updateRunAction } from "@/app/actions/runs"
import { RunFormSheet } from "@/components/features/runs/run-form-sheet"
import { Button } from "@/components/ui/button"
import type { RunFormValues, RunReferences, UserRole } from "@/types/qa"

export function RunEditor({
  initialValues,
  references,
  role,
  runId,
}: {
  initialValues: RunFormValues
  references: RunReferences
  role: UserRole
  runId: string
}) {
  const [open, setOpen] = useState(false)

  if (role === "QA_TESTER") {
    return null
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon data-icon="inline-start" />
        Edit Run
      </Button>
      <RunFormSheet
        action={updateRunAction}
        description="Update run metadata, status, and assignments."
        initialValues={initialValues}
        onOpenChange={setOpen}
        onSuccess={() => setOpen(false)}
        open={open}
        references={references}
        runId={runId}
        submitLabel="Save changes"
        title="Edit Test Run"
      />
    </>
  )
}
