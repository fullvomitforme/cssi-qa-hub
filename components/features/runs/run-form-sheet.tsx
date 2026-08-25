"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { RunActionState } from "@/app/actions/runs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { RunFormValues, RunReferences } from "@/types/qa"

const initialRunActionState: RunActionState = { status: "idle" }

interface RunFormSheetProps {
  action: (state: RunActionState, payload: FormData) => Promise<RunActionState>
  description: string
  initialValues?: RunFormValues | null
  onOpenChange: (open: boolean) => void
  onSuccess?: (runId: string) => void
  open: boolean
  references: RunReferences
  runId?: string
  submitLabel: string
  title: string
}

const emptyValues: RunFormValues = {
  name: "",
  applicationId: "",
  testPlanId: "",
  releaseId: "",
  environmentId: "",
  build: "",
  status: "IN_PROGRESS",
  assignmentProfileIds: [],
}

export function RunFormSheet({ ...props }: RunFormSheetProps) {
  const formKey = `${props.runId ?? "create"}:${props.open ? "open" : "closed"}`
  return <RunFormSheetInner key={formKey} {...props} />
}

function RunFormSheetInner({
  action,
  description,
  initialValues,
  onOpenChange,
  onSuccess,
  open,
  references,
  runId,
  submitLabel,
  title,
}: RunFormSheetProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    action,
    initialRunActionState
  )
  const [values, setValues] = useState<RunFormValues>(
    initialValues ?? {
      ...emptyValues,
      applicationId: references.applications[0]?.id ?? "",
      environmentId: references.environments[0]?.id ?? "",
    }
  )

  const filteredPlans = useMemo(
    () =>
      references.planOptions.filter(
        (plan) =>
          !values.applicationId || plan.applicationId === values.applicationId
      ),
    [references.planOptions, values.applicationId]
  )

  const filteredReleases = useMemo(
    () =>
      references.releases.filter(
        (release) =>
          (!values.applicationId ||
            release.applicationId === values.applicationId) &&
          (!values.environmentId ||
            release.environmentId === values.environmentId)
      ),
    [references.releases, values.applicationId, values.environmentId]
  )

  const selectedAssignmentIdSet = useMemo(
    () => new Set(values.assignmentProfileIds),
    [values.assignmentProfileIds]
  )

  const fieldErrors = state.fieldErrors ?? {}
  const isEditing = Boolean(runId)

  useEffect(() => {
    if (state.status === "success" && state.runId) {
      router.refresh()
      onSuccess?.(state.runId)
    }
  }, [onSuccess, router, state.runId, state.status])

  function updateValue<K extends keyof RunFormValues>(
    key: K,
    nextValue: RunFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: nextValue }))
  }

  function handleApplicationChange(nextApplicationId: string) {
    setValues((current) => ({
      ...current,
      applicationId: nextApplicationId,
      testPlanId: "",
      releaseId: "",
    }))
  }

  function handlePlanChange(nextPlanId: string) {
    const selectedPlan = references.planOptions.find(
      (plan) => plan.id === nextPlanId
    )

    setValues((current) => ({
      ...current,
      testPlanId: nextPlanId,
      applicationId: selectedPlan?.applicationId ?? current.applicationId,
      environmentId: selectedPlan?.environmentId ?? current.environmentId,
      releaseId: selectedPlan?.releaseId ?? current.releaseId,
      name: current.name || selectedPlan?.name || current.name,
    }))
  }

  function toggleAssignment(profileId: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      assignmentProfileIds: checked
        ? [...current.assignmentProfileIds, profileId]
        : current.assignmentProfileIds.filter((id) => id !== profileId),
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-1 flex-col">
          {runId ? <input type="hidden" name="runId" value={runId} /> : null}
          <input
            type="hidden"
            name="applicationId"
            value={values.applicationId}
          />
          <input type="hidden" name="testPlanId" value={values.testPlanId} />
          <input type="hidden" name="releaseId" value={values.releaseId} />
          <input
            type="hidden"
            name="environmentId"
            value={values.environmentId}
          />
          <input
            type="hidden"
            name="assignmentProfileIds"
            value={JSON.stringify(values.assignmentProfileIds)}
          />

          <div className="qa-scrollbar grid flex-1 gap-4 overflow-y-auto p-4">
            {state.status === "error" && state.message ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {state.message}
              </p>
            ) : null}

            <label className="block text-sm font-medium">
              Run name
              <Input
                name="name"
                className="mt-1.5"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Portal Regression — v1.10.0"
              />
              {fieldErrors.name ? (
                <span className="mt-1 block text-xs text-destructive">
                  {fieldErrors.name[0]}
                </span>
              ) : null}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Application
                <select
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  value={values.applicationId}
                  onChange={(event) =>
                    handleApplicationChange(event.target.value)
                  }
                  disabled={isEditing}
                >
                  <option value="">Select application</option>
                  {references.applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.applicationId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.applicationId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Test plan
                <select
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  value={values.testPlanId}
                  onChange={(event) => handlePlanChange(event.target.value)}
                  disabled={isEditing}
                >
                  <option value="">
                    {filteredPlans.length > 0
                      ? "Select test plan"
                      : "No plans available"}
                  </option>
                  {filteredPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.testPlanId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.testPlanId[0]}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm font-medium">
                Release
                <select
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  value={values.releaseId}
                  onChange={(event) =>
                    updateValue("releaseId", event.target.value)
                  }
                >
                  <option value="">
                    {filteredReleases.length > 0
                      ? "Select release"
                      : "No releases available"}
                  </option>
                  {filteredReleases.map((release) => (
                    <option key={release.id} value={release.id}>
                      {release.version}
                      {release.build ? ` · ${release.build}` : ""}
                    </option>
                  ))}
                </select>
                {fieldErrors.releaseId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.releaseId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Environment
                <select
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  value={values.environmentId}
                  onChange={(event) => {
                    updateValue("environmentId", event.target.value)
                    updateValue("releaseId", "")
                  }}
                >
                  <option value="">Select environment</option>
                  {references.environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {environment.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.environmentId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.environmentId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Status
                <select
                  name="status"
                  className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  value={values.status}
                  onChange={(event) =>
                    updateValue(
                      "status",
                      event.target.value as RunFormValues["status"]
                    )
                  }
                >
                  {[
                    "NOT_STARTED",
                    "IN_PROGRESS",
                    "BLOCKED",
                    "COMPLETED",
                    "CANCELLED",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Build
              <Input
                name="build"
                className="mt-1.5 font-mono"
                value={values.build}
                onChange={(event) => updateValue("build", event.target.value)}
                placeholder="a829d41"
              />
              {fieldErrors.build ? (
                <span className="mt-1 block text-xs text-destructive">
                  {fieldErrors.build[0]}
                </span>
              ) : null}
            </label>

            <section className="space-y-3 rounded-md border border-dashed p-4">
              <div>
                <p className="text-sm font-medium">Assigned QA members</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assigned members can access the run in real mode.
                </p>
              </div>
              <div className="grid gap-2">
                {references.assigneeOptions.map((assignee) => (
                  <label
                    key={assignee.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-left hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignmentIdSet.has(assignee.id)}
                      onChange={(event) =>
                        toggleAssignment(assignee.id, event.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {assignee.fullName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {assignee.role} · {assignee.email}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {fieldErrors.assignmentProfileIds ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.assignmentProfileIds[0]}
                </p>
              ) : null}
            </section>

            {!isEditing ? (
              <p className="text-xs text-muted-foreground">
                Creating a real test run snapshots execution records from the
                selected plan scenarios so later scenario edits do not rewrite
                the run scope.
              </p>
            ) : null}
          </div>

          <SheetFooter className="border-t">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
