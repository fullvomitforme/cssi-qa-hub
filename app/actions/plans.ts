"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import {
  normalizePlanFormPayload,
  type PlanFormData,
} from "@/lib/plan-form-schema"
import { getCurrentProfile } from "@/services/auth"
import {
  createPlanRecord,
  PlanMutationError,
  updatePlanRecord,
} from "@/services/plans"
import type { PlanFormValues } from "@/types/qa"

export interface PlanActionState {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[]>
  planId?: string
}

const initialPlanActionState: PlanActionState = { status: "idle" }

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

function normalizePlanFormData(formData: FormData) {
  return normalizePlanFormPayload({
    planId:
      typeof formData.get("planId") === "string"
        ? formData.get("planId")
        : undefined,
    name: formData.get("name"),
    applicationId: formData.get("applicationId"),
    releaseId: formData.get("releaseId"),
    environmentId: formData.get("environmentId"),
    ownerId: formData.get("ownerId"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    targetCompletion: formData.get("targetCompletion"),
    status: formData.get("status"),
    scenarioIds: parseJsonField<string[]>(formData.get("scenarioIds"), []),
    assignmentProfileIds: parseJsonField<string[]>(
      formData.get("assignmentProfileIds"),
      []
    ),
  })
}

async function guardPlanWriteAccess() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role === "QA_TESTER") {
    return null
  }

  return profile
}

function toValues(parsed: PlanFormData): PlanFormValues {
  return {
    name: parsed.name,
    applicationId: parsed.applicationId,
    releaseId: parsed.releaseId,
    environmentId: parsed.environmentId,
    ownerId: parsed.ownerId,
    description: parsed.description,
    startDate: parsed.startDate,
    targetCompletion: parsed.targetCompletion,
    status: parsed.status,
    scenarioIds: parsed.scenarioIds,
    assignmentProfileIds: parsed.assignmentProfileIds,
  }
}

function getForbiddenState(): PlanActionState {
  return {
    status: "error",
    message: "You do not have permission to change test plans.",
  }
}

export async function createPlanAction(
  _: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local test plan drafts only.",
    }
  }

  const profile = await guardPlanWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizePlanFormData(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted plan fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const planId = await createPlanRecord(toValues(parsed.data))
    revalidatePath("/plans")
    revalidatePath(`/plans/${planId}`)

    return {
      status: "success",
      message: "Test plan created.",
      planId,
    }
  } catch (error) {
    if (error instanceof PlanMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Plan data is invalid or references unavailable scenarios, members, or releases."
            : error.message,
      }
    }

    console.error("createPlanAction failed", error)
    return {
      status: "error",
      message: "Unable to create the test plan right now.",
    }
  }
}

export async function updatePlanAction(
  _: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local test plan drafts only.",
    }
  }

  const profile = await guardPlanWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizePlanFormData(formData)
  if (!parsed.success || !parsed.data.planId) {
    return {
      status: "error",
      message: "Check the highlighted plan fields and try again.",
      fieldErrors: parsed.success
        ? { planId: ["Plan id is required."] }
        : parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const planId = await updatePlanRecord(
      parsed.data.planId,
      toValues(parsed.data)
    )
    revalidatePath("/plans")
    revalidatePath(`/plans/${planId}`)

    return {
      status: "success",
      message: "Test plan updated.",
      planId,
    }
  } catch (error) {
    if (error instanceof PlanMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Plan data is invalid or references unavailable scenarios, members, or releases."
            : error.message,
      }
    }

    console.error("updatePlanAction failed", error)
    return {
      status: "error",
      message: "Unable to update the test plan right now.",
    }
  }
}

export { initialPlanActionState }
