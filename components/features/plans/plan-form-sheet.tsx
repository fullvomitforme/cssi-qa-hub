"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import type { PlanActionState } from "@/app/actions/plans"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  PlanFormValues,
  PlanReferences,
  ScenarioHierarchy,
  ScenarioSummary,
} from "@/types/qa"

const initialPlanActionState: PlanActionState = { status: "idle" }

interface PlanFormSheetProps {
  action: (
    state: PlanActionState,
    payload: FormData
  ) => Promise<PlanActionState>
  description: string
  initialValues?: PlanFormValues | null
  onOpenChange: (open: boolean) => void
  onSuccess?: (planId: string) => void
  open: boolean
  planId?: string
  references: PlanReferences
  scenarioHierarchy: ScenarioHierarchy
  submitLabel: string
  title: string
}

const emptyValues: PlanFormValues = {
  name: "",
  applicationId: "",
  releaseId: "",
  environmentId: "",
  ownerId: "",
  description: "",
  startDate: "2026-08-25",
  targetCompletion: "2026-09-03",
  status: "DRAFT",
  scenarioIds: [],
  assignmentProfileIds: [],
}

export function PlanFormSheet({ ...props }: PlanFormSheetProps) {
  const formKey = `${props.planId ?? "create"}:${props.open ? "open" : "closed"}`
  return <PlanFormSheetInner key={formKey} {...props} />
}

function PlanFormSheetInner({
  action,
  description,
  initialValues,
  onOpenChange,
  onSuccess,
  open,
  planId,
  references,
  scenarioHierarchy,
  submitLabel,
  title,
}: PlanFormSheetProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    action,
    initialPlanActionState
  )
  const [values, setValues] = useState<PlanFormValues>(
    initialValues ?? {
      ...emptyValues,
      ownerId: references.ownerOptions[0]?.id ?? "",
    }
  )
  const [scenarioSearch, setScenarioSearch] = useState("")
  const [scenarioModule, setScenarioModule] = useState("")
  const [scenarioFeature, setScenarioFeature] = useState("")
  const [scenarioType, setScenarioType] = useState("")
  const [scenarioPriority, setScenarioPriority] = useState("")
  const [scenarioOptions, setScenarioOptions] = useState<ScenarioSummary[]>([])
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [scenarioError, setScenarioError] = useState<string | null>(null)

  const releaseOptions = useMemo(
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

  const moduleOptions = useMemo(
    () =>
      scenarioHierarchy.modules.filter(
        (module) =>
          !values.applicationId || module.applicationId === values.applicationId
      ),
    [scenarioHierarchy.modules, values.applicationId]
  )

  const featureOptions = useMemo(
    () =>
      scenarioHierarchy.features.filter(
        (feature) =>
          (!values.applicationId ||
            feature.applicationId === values.applicationId) &&
          (!scenarioModule || feature.moduleSlug === scenarioModule)
      ),
    [scenarioHierarchy.features, scenarioModule, values.applicationId]
  )

  useEffect(() => {
    if (!open || !values.applicationId) return

    const controller = new AbortController()
    const params = new URLSearchParams({ applicationId: values.applicationId })
    if (scenarioSearch) params.set("search", scenarioSearch)
    if (scenarioModule) params.set("module", scenarioModule)
    if (scenarioFeature) params.set("feature", scenarioFeature)
    if (scenarioType) params.set("type", scenarioType)
    if (scenarioPriority) params.set("priority", scenarioPriority)

    async function run() {
      setScenarioLoading(true)
      setScenarioError(null)

      try {
        const response = await fetch(
          `/api/plans/scenarios?${params.toString()}`,
          {
            credentials: "same-origin",
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error("Unable to load scenarios")
        }

        const payload = (await response.json()) as { items: ScenarioSummary[] }
        setScenarioOptions(payload.items)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("scenario library request failed", error)
        setScenarioError("Unable to load scenarios")
      } finally {
        if (!controller.signal.aborted) setScenarioLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [
    open,
    scenarioFeature,
    scenarioModule,
    scenarioPriority,
    scenarioSearch,
    scenarioType,
    values.applicationId,
  ])

  useEffect(() => {
    if (state.status === "success" && state.planId) {
      router.refresh()
      onSuccess?.(state.planId)
    }
  }, [onSuccess, router, state.planId, state.status])

  const selectedScenarioIdSet = useMemo(
    () => new Set(values.scenarioIds),
    [values.scenarioIds]
  )
  const selectedAssignmentIdSet = useMemo(
    () => new Set(values.assignmentProfileIds),
    [values.assignmentProfileIds]
  )

  const fieldErrors = state.fieldErrors ?? {}

  function updateValue<K extends keyof PlanFormValues>(
    key: K,
    nextValue: PlanFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: nextValue }))
  }

  function handleApplicationChange(nextApplicationId: string) {
    setScenarioModule("")
    setScenarioFeature("")
    setScenarioOptions([])
    setScenarioError(null)
    setValues((current) => ({
      ...current,
      applicationId: nextApplicationId,
      releaseId: "",
      scenarioIds: [],
    }))
  }

  function handleEnvironmentChange(nextEnvironmentId: string) {
    setValues((current) => ({
      ...current,
      environmentId: nextEnvironmentId,
      releaseId: "",
    }))
  }

  const hasReleaseOptions = releaseOptions.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          {planId ? <input type="hidden" name="planId" value={planId} /> : null}
          <input
            type="hidden"
            name="applicationId"
            value={values.applicationId}
          />
          <input type="hidden" name="releaseId" value={values.releaseId} />
          <input
            type="hidden"
            name="environmentId"
            value={values.environmentId}
          />
          <input type="hidden" name="ownerId" value={values.ownerId} />
          <input
            type="hidden"
            name="scenarioIds"
            value={JSON.stringify(values.scenarioIds)}
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
              Plan name
              <Input
                name="name"
                className="mt-1.5"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Portal v1.10.0 Regression"
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
                Environment
                <Select
                  value={values.environmentId}
                  onValueChange={(value) =>
                    handleEnvironmentChange(value ?? "")
                  }
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Release
                <Select
                  value={values.releaseId}
                  onValueChange={(value) =>
                    updateValue("releaseId", value ?? "")
                  }
                  disabled={!values.applicationId || !values.environmentId}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue
                      placeholder={
                        hasReleaseOptions
                          ? "Select release"
                          : "No releases available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!hasReleaseOptions ? (
                      <SelectItem value="" disabled>
                        No releases available
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="">Select release</SelectItem>
                        {releaseOptions.map((release) => (
                          <SelectItem key={release.id} value={release.id}>
                            {release.version}
                            {release.build ? ` · ${release.build}` : ""}
                          </SelectItem>
                        ))}
                      </>
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
                Owner
                <Select
                  value={values.ownerId}
                  onValueChange={(value) => updateValue("ownerId", value ?? "")}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select owner</SelectItem>
                    {references.ownerOptions.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.ownerId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.ownerId[0]}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm font-medium">
                Status
                <Select
                  name="status"
                  value={values.status}
                  onValueChange={(value) =>
                    updateValue("status", value as PlanFormValues["status"])
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["DRAFT", "READY", "ACTIVE", "COMPLETED", "ARCHIVED"].map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Start date
                <Input
                  name="startDate"
                  type="date"
                  className="mt-1.5"
                  value={values.startDate}
                  onChange={(event) =>
                    updateValue("startDate", event.target.value)
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Target completion
                <Input
                  name="targetCompletion"
                  type="date"
                  className="mt-1.5"
                  value={values.targetCompletion}
                  onChange={(event) =>
                    updateValue("targetCompletion", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Description
              <Textarea
                name="description"
                className="mt-1.5 min-h-24"
                value={values.description}
                onChange={(event) =>
                  updateValue("description", event.target.value)
                }
                placeholder="Regression scope, risks, and exit criteria…"
              />
            </label>

            <section className="space-y-3 rounded-md border border-dashed p-4">
              <div>
                <p className="text-sm font-medium">Select scenarios</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose persisted scenarios for this test plan.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_repeat(4,10rem)]">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={scenarioSearch}
                    onChange={(event) => setScenarioSearch(event.target.value)}
                    placeholder="Search scenarios…"
                    className="pl-8"
                  />
                </div>
                <Select
                  value={scenarioModule}
                  onValueChange={(value) => {
                    setScenarioModule(value ?? "")
                    setScenarioFeature("")
                  }}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All modules</SelectItem>
                    {moduleOptions.map((module) => (
                      <SelectItem key={module.id} value={module.slug}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={scenarioFeature}
                  onValueChange={(value) => setScenarioFeature(value ?? "")}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All features</SelectItem>
                    {featureOptions.map((feature) => (
                      <SelectItem key={feature.id} value={feature.slug}>
                        {feature.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={scenarioType}
                  onValueChange={(value) => setScenarioType(value ?? "")}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {[
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
                    ].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={scenarioPriority}
                  onValueChange={(value) => setScenarioPriority(value ?? "")}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    {["P0", "P1", "P2", "P3"].map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {values.scenarioIds.length} selected
              </p>
              {scenarioLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading scenarios…
                </p>
              ) : scenarioError ? (
                <p className="text-sm text-destructive">{scenarioError}</p>
              ) : (
                <div className="max-h-64 divide-y overflow-y-auto rounded-md border">
                  {scenarioOptions.map((scenario) => (
                    <label
                      key={scenario.id}
                      className="flex cursor-pointer items-start gap-2 p-3 text-left hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScenarioIdSet.has(scenario.id)}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            scenarioIds: event.target.checked
                              ? [...current.scenarioIds, scenario.id]
                              : current.scenarioIds.filter(
                                  (id) => id !== scenario.id
                                ),
                          }))
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {scenario.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {scenario.application} · {scenario.module} /{" "}
                          {scenario.feature}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline">{scenario.type}</Badge>
                          <Badge variant="neutral">{scenario.priority}</Badge>
                        </span>
                      </span>
                    </label>
                  ))}
                  {scenarioOptions.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No scenarios match this application and filter set.
                    </p>
                  ) : null}
                </div>
              )}
              {fieldErrors.scenarioIds ? (
                <span className="block text-xs text-destructive">
                  {fieldErrors.scenarioIds[0]}
                </span>
              ) : null}
            </section>

            <section className="space-y-3 rounded-md border border-dashed p-4">
              <div>
                <p className="text-sm font-medium">Assign QA members</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active QA members who will own execution for this plan.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {references.assigneeOptions.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-start gap-2 rounded-md border p-3 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignmentIdSet.has(profile.id)}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          assignmentProfileIds: event.target.checked
                            ? [...current.assignmentProfileIds, profile.id]
                            : current.assignmentProfileIds.filter(
                                (id) => id !== profile.id
                              ),
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {profile.fullName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {profile.role}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {fieldErrors.assignmentProfileIds ? (
                <span className="block text-xs text-destructive">
                  {fieldErrors.assignmentProfileIds[0]}
                </span>
              ) : null}
            </section>
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
