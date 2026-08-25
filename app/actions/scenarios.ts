"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import {
  normalizeScenarioFormPayload,
  type ScenarioFormData,
} from "@/lib/scenario-form-schema"
import {
  createScenarioRecord,
  ScenarioMutationError,
  updateScenarioRecord,
} from "@/services/scenarios"
import { getCurrentProfile } from "@/services/auth"
import type { ScenarioFormValues } from "@/types/qa"

export interface ScenarioActionState {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[]>
  scenarioId?: string
}

const initialScenarioActionState: ScenarioActionState = { status: "idle" }

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeScenarioFormData(formData: FormData) {
  const tags = parseJsonField<string[]>(formData.get("tags"), [])
  const steps = parseJsonField<Array<Record<string, unknown>>>(
    formData.get("steps"),
    []
  )

  return normalizeScenarioFormPayload({
    scenarioId:
      typeof formData.get("scenarioId") === "string"
        ? formData.get("scenarioId")
        : undefined,
    applicationId: formData.get("applicationId"),
    moduleId: formData.get("moduleId"),
    featureId: formData.get("featureId"),
    title: formData.get("title"),
    description: formData.get("description"),
    preconditions: formData.get("preconditions"),
    type: formData.get("type"),
    priority: formData.get("priority"),
    expectedResult: formData.get("expectedResult"),
    steps,
    tags,
  })
}

function getForbiddenState(): ScenarioActionState {
  return {
    status: "error",
    message: "You do not have permission to change test scenarios.",
  }
}

async function guardScenarioWriteAccess() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role === "QA_TESTER") {
    return null
  }

  return profile
}

function toValues(parsed: ScenarioFormData): ScenarioFormValues {
  return {
    applicationId: parsed.applicationId,
    moduleId: parsed.moduleId,
    featureId: parsed.featureId,
    title: parsed.title,
    description: parsed.description,
    preconditions: parsed.preconditions,
    type: parsed.type,
    priority: parsed.priority,
    expectedResult: parsed.expectedResult,
    steps: parsed.steps.map((step) => ({
      id: step.id,
      instruction: step.instruction,
      expectedResult: step.expectedResult,
    })),
    tags: parsed.tags,
  }
}

export async function createScenarioAction(
  _: ScenarioActionState,
  formData: FormData
): Promise<ScenarioActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local scenario drafts only.",
    }
  }

  const profile = await guardScenarioWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizeScenarioFormData(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted scenario fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const scenarioId = await createScenarioRecord(toValues(parsed.data))
    revalidatePath("/scenarios")
    revalidatePath(`/scenarios/${scenarioId}`)

    return {
      status: "success",
      message: "Scenario created.",
      scenarioId,
    }
  } catch (error) {
    if (error instanceof ScenarioMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Scenario data is invalid or references an unavailable hierarchy item."
            : error.message,
      }
    }

    console.error("createScenarioAction failed", error)
    return {
      status: "error",
      message: "Unable to create the scenario right now.",
    }
  }
}

export async function updateScenarioAction(
  _: ScenarioActionState,
  formData: FormData
): Promise<ScenarioActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local scenario drafts only.",
    }
  }

  const profile = await guardScenarioWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizeScenarioFormData(formData)
  if (!parsed.success || !parsed.data.scenarioId) {
    return {
      status: "error",
      message: "Check the highlighted scenario fields and try again.",
      fieldErrors: parsed.success
        ? { scenarioId: ["Scenario id is required."] }
        : parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const scenarioId = await updateScenarioRecord(
      parsed.data.scenarioId,
      toValues(parsed.data)
    )
    revalidatePath("/scenarios")
    revalidatePath(`/scenarios/${scenarioId}`)

    return {
      status: "success",
      message: "Scenario updated.",
      scenarioId,
    }
  } catch (error) {
    if (error instanceof ScenarioMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Scenario data is invalid or references an unavailable hierarchy item."
            : error.message,
      }
    }

    console.error("updateScenarioAction failed", error)
    return {
      status: "error",
      message: "Unable to update the scenario right now.",
    }
  }
}

export { initialScenarioActionState }
