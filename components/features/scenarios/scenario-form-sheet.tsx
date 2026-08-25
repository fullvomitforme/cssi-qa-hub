"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import type { ScenarioActionState } from "@/app/actions/scenarios"
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
  ScenarioFormValues,
  ScenarioHierarchy,
  TestType,
} from "@/types/qa"

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

const emptyValues: ScenarioFormValues = {
  applicationId: "",
  moduleId: "",
  featureId: "",
  title: "",
  description: "",
  preconditions: "",
  type: "HAPPY_PATH",
  priority: "P2",
  expectedResult: "",
  steps: [{ instruction: "", expectedResult: "" }],
  tags: [],
}

const initialScenarioActionState: ScenarioActionState = { status: "idle" }

interface ScenarioFormSheetProps {
  action: (
    state: ScenarioActionState,
    payload: FormData
  ) => Promise<ScenarioActionState>
  description: string
  hierarchy: ScenarioHierarchy
  initialValues?: ScenarioFormValues | null
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
  onSuccess?: (scenarioId: string) => void
  open: boolean
  scenarioId?: string
  submitLabel: string
  title: string
}

export function ScenarioFormSheet({ ...props }: ScenarioFormSheetProps) {
  const formKey = `${props.mode}:${props.scenarioId ?? "create"}:${props.open ? "open" : "closed"}`

  return <ScenarioFormSheetInner key={formKey} {...props} />
}

function ScenarioFormSheetInner({
  action,
  description,
  hierarchy,
  initialValues,
  onOpenChange,
  onSuccess,
  open,
  scenarioId,
  submitLabel,
  title,
}: ScenarioFormSheetProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    action,
    initialScenarioActionState
  )
  const [values, setValues] = useState<ScenarioFormValues>(
    initialValues ?? emptyValues
  )
  const [tagInput, setTagInput] = useState("")

  const moduleOptions = useMemo(
    () =>
      hierarchy.modules.filter(
        (module) =>
          !values.applicationId || module.applicationId === values.applicationId
      ),
    [hierarchy.modules, values.applicationId]
  )

  const featureOptions = useMemo(
    () =>
      hierarchy.features.filter(
        (feature) =>
          (!values.applicationId ||
            feature.applicationId === values.applicationId) &&
          (!values.moduleId || feature.moduleId === values.moduleId)
      ),
    [hierarchy.features, values.applicationId, values.moduleId]
  )
  const selectedModuleId = moduleOptions.some(
    (moduleOption) => moduleOption.id === values.moduleId
  )
    ? values.moduleId
    : ""
  const selectedFeatureId = featureOptions.some(
    (featureOption) => featureOption.id === values.featureId
  )
    ? values.featureId
    : ""

  useEffect(() => {
    if (state.status !== "success" || !state.scenarioId) return
    router.refresh()
    onSuccess?.(state.scenarioId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scenarioId, state.status])

  function setField<K extends keyof ScenarioFormValues>(
    field: K,
    nextValue: ScenarioFormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: nextValue }))
  }

  function addTag() {
    const normalized = tagInput.trim().toLowerCase()
    if (!normalized || values.tags.includes(normalized)) {
      setTagInput("")
      return
    }

    setValues((current) => ({
      ...current,
      tags: [...current.tags, normalized].toSorted(),
    }))
    setTagInput("")
  }

  function updateStep(
    index: number,
    field: "instruction" | "expectedResult",
    nextValue: string
  ) {
    setValues((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: nextValue } : step
      ),
    }))
  }

  function addStep() {
    setValues((current) => ({
      ...current,
      steps: [...current.steps, { instruction: "", expectedResult: "" }],
    }))
  }

  function removeStep(index: number) {
    setValues((current) => ({
      ...current,
      steps:
        current.steps.length === 1
          ? current.steps
          : current.steps.filter((_, stepIndex) => stepIndex !== index),
    }))
  }

  function moveStep(index: number, direction: -1 | 1) {
    setValues((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.steps.length) {
        return current
      }

      const steps = [...current.steps]
      ;[steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]]
      return { ...current, steps }
    })
  }

  const fieldErrors = state.fieldErrors ?? {}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          {scenarioId ? (
            <input type="hidden" name="scenarioId" value={scenarioId} />
          ) : null}
          <input
            type="hidden"
            name="applicationId"
            value={values.applicationId}
          />
          <input type="hidden" name="moduleId" value={selectedModuleId} />
          <input type="hidden" name="featureId" value={selectedFeatureId} />
          <input
            type="hidden"
            name="steps"
            value={JSON.stringify(values.steps)}
          />
          <input
            type="hidden"
            name="tags"
            value={JSON.stringify(values.tags)}
          />

          <div className="qa-scrollbar grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
            {state.status === "error" && state.message ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {state.message}
              </div>
            ) : null}

            <label className="text-sm font-medium">
              Scenario title
              <Input
                name="title"
                className="mt-1.5"
                required
                value={values.title}
                onChange={(event) => setField("title", event.target.value)}
              />
              {fieldErrors.title ? (
                <span className="mt-1 block text-xs text-destructive">
                  {fieldErrors.title[0]}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium">
              Description
              <Textarea
                name="description"
                className="mt-1.5 min-h-24"
                required
                value={values.description}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
              />
              {fieldErrors.description ? (
                <span className="mt-1 block text-xs text-destructive">
                  {fieldErrors.description[0]}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium">
              Preconditions
              <Textarea
                name="preconditions"
                className="mt-1.5 min-h-20"
                value={values.preconditions}
                onChange={(event) =>
                  setField("preconditions", event.target.value)
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Application
                <Select
                  value={values.applicationId}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      applicationId: value ?? "",
                      moduleId: "",
                      featureId: "",
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select application</SelectItem>
                    {hierarchy.applications.map((application) => (
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

              <label className="text-sm font-medium">
                Priority
                <Select
                  name="priority"
                  value={values.priority}
                  onValueChange={(value) =>
                    setField(
                      "priority",
                      value as ScenarioFormValues["priority"]
                    )
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["P0", "P1", "P2", "P3"] as const).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Module
                <Select
                  value={selectedModuleId}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      moduleId: value ?? "",
                      featureId: "",
                    }))
                  }
                  disabled={!values.applicationId}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select module</SelectItem>
                    {moduleOptions.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.moduleId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.moduleId[0]}
                  </span>
                ) : null}
              </label>

              <label className="text-sm font-medium">
                Feature
                <Select
                  value={selectedFeatureId}
                  onValueChange={(value) => setField("featureId", value ?? "")}
                  disabled={!values.moduleId}
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue placeholder="Select feature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select feature</SelectItem>
                    {featureOptions.map((feature) => (
                      <SelectItem key={feature.id} value={feature.id}>
                        {feature.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.featureId ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.featureId[0]}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Test type
                <Select
                  name="type"
                  value={values.type}
                  onValueChange={(value) =>
                    setField("type", value as ScenarioFormValues["type"])
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <label className="text-sm font-medium">
              Expected result
              <Textarea
                name="expectedResult"
                className="mt-1.5 min-h-20"
                required
                value={values.expectedResult}
                onChange={(event) =>
                  setField("expectedResult", event.target.value)
                }
              />
              {fieldErrors.expectedResult ? (
                <span className="mt-1 block text-xs text-destructive">
                  {fieldErrors.expectedResult[0]}
                </span>
              ) : null}
            </label>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Steps</h3>
                  <p className="text-xs text-muted-foreground">
                    Ordered test steps for this scenario.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addStep}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add step
                </Button>
              </div>
              {values.steps.map((step, index) => (
                <div
                  key={step.id ?? `draft-step-${index}`}
                  className="rounded-lg border p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Step {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move step ${index + 1} up`}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === values.steps.length - 1}
                        aria-label={`Move step ${index + 1} down`}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeStep(index)}
                        disabled={values.steps.length === 1}
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </div>
                  <label className="text-sm font-medium">
                    Instruction
                    <Textarea
                      className="mt-1.5 min-h-20"
                      value={step.instruction}
                      onChange={(event) =>
                        updateStep(index, "instruction", event.target.value)
                      }
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium">
                    Step expected result
                    <Textarea
                      className="mt-1.5 min-h-16"
                      value={step.expectedResult}
                      onChange={(event) =>
                        updateStep(index, "expectedResult", event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
              {fieldErrors.steps ? (
                <span className="block text-xs text-destructive">
                  {fieldErrors.steps[0]}
                </span>
              ) : null}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Tags</h3>
                <p className="text-xs text-muted-foreground">
                  Add lightweight labels such as smoke, regression, or auth.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add a tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {values.tags.map((tag) => (
                  <Badge key={tag} variant="neutral" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-black/10"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          tags: current.tags.filter((value) => value !== tag),
                        }))
                      }
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
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
