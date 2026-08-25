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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
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

          <div className="qa-scrollbar grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
            {state.status === "error" && state.message ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {state.message}
              </div>
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
                <Select
                  value={values.applicationId}
                  onValueChange={(value) =>
                    handleApplicationChange(value ?? "")
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select application</SelectItem>
                    {references.applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {application.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.applicationId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.applicationId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Test plan
                <Select
                  value={values.testPlanId}
                  onValueChange={(value) => handlePlanChange(value ?? "")}
                  disabled={isEditing}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue
                      placeholder={
                        filteredPlans.length > 0
                          ? "Select test plan"
                          : "No plans available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlans.length > 0 ? (
                      <>
                        <SelectItem value="">Select test plan</SelectItem>
                        {filteredPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <SelectItem value="" disabled>
                        No plans available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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
                <Select
                  value={values.releaseId}
                  onValueChange={(value) =>
                    updateValue("releaseId", value ?? "")
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue
                      placeholder={
                        filteredReleases.length > 0
                          ? "Select release"
                          : "No releases available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredReleases.length > 0 ? (
                      <>
                        <SelectItem value="">Select release</SelectItem>
                        {filteredReleases.map((release) => (
                          <SelectItem key={release.id} value={release.id}>
                            {release.version}
                            {release.build ? ` · ${release.build}` : ""}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <SelectItem value="" disabled>
                        No releases available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {fieldErrors.releaseId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.releaseId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Environment
                <Select
                  value={values.environmentId}
                  onValueChange={(value) => {
                    updateValue("environmentId", value ?? "")
                    updateValue("releaseId", "")
                  }}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select environment</SelectItem>
                    {references.environments.map((environment) => (
                      <SelectItem key={environment.id} value={environment.id}>
                        {environment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.environmentId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.environmentId[0]}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm font-medium">
                Status
                <Select
                  name="status"
                  value={values.status}
                  onValueChange={(value) =>
                    updateValue("status", value as RunFormValues["status"])
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "NOT_STARTED",
                      "IN_PROGRESS",
                      "BLOCKED",
                      "COMPLETED",
                      "CANCELLED",
                    ].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
