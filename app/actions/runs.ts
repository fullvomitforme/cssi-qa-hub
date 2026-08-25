"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import {
  normalizeRunFormPayload,
  type RunFormData,
} from "@/lib/run-form-schema"
import { getCurrentProfile } from "@/services/auth"
import {
  createRunRecord,
  RunMutationError,
  updateRunRecord,
} from "@/services/runs"
import type { RunFormValues } from "@/types/qa"

export interface RunActionState {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[]>
  runId?: string
}

const initialRunActionState: RunActionState = { status: "idle" }

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

function normalizeRunFormData(formData: FormData) {
  return normalizeRunFormPayload({
    runId:
      typeof formData.get("runId") === "string"
        ? formData.get("runId")
        : undefined,
    name: formData.get("name"),
    applicationId: formData.get("applicationId"),
    testPlanId: formData.get("testPlanId"),
    releaseId: formData.get("releaseId"),
    environmentId: formData.get("environmentId"),
    build: formData.get("build"),
    status: formData.get("status"),
    assignmentProfileIds: parseJsonField<string[]>(
      formData.get("assignmentProfileIds"),
      []
    ),
  })
}

async function guardRunWriteAccess() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role === "QA_TESTER") {
    return null
  }

  return profile
}

function toValues(parsed: RunFormData): RunFormValues {
  return {
    name: parsed.name,
    applicationId: parsed.applicationId,
    testPlanId: parsed.testPlanId,
    releaseId: parsed.releaseId,
    environmentId: parsed.environmentId,
    build: parsed.build,
    status: parsed.status,
    assignmentProfileIds: parsed.assignmentProfileIds,
  }
}

function getForbiddenState(): RunActionState {
  return {
    status: "error",
    message: "You do not have permission to change test runs.",
  }
}

export async function createRunAction(
  _: RunActionState,
  formData: FormData
): Promise<RunActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local test run drafts only.",
    }
  }

  const profile = await guardRunWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizeRunFormData(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted run fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const runId = await createRunRecord(toValues(parsed.data))
    revalidatePath("/runs")
    revalidatePath(`/runs/${runId}`)

    return {
      status: "success",
      message: "Test run created.",
      runId,
    }
  } catch (error) {
    if (error instanceof RunMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Run data is invalid or references unavailable plans, releases, environments, or assignees."
            : error.message,
      }
    }

    console.error("createRunAction failed", error)
    return {
      status: "error",
      message: "Unable to create the test run right now.",
    }
  }
}

export async function updateRunAction(
  _: RunActionState,
  formData: FormData
): Promise<RunActionState> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local test run drafts only.",
    }
  }

  const profile = await guardRunWriteAccess()
  if (!profile) return getForbiddenState()

  const parsed = normalizeRunFormData(formData)
  if (!parsed.success || !parsed.data.runId) {
    return {
      status: "error",
      message: "Check the highlighted run fields and try again.",
      fieldErrors: parsed.success
        ? { runId: ["Run id is required."] }
        : parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const runId = await updateRunRecord(
      parsed.data.runId,
      toValues(parsed.data)
    )
    revalidatePath("/runs")
    revalidatePath(`/runs/${runId}`)

    return {
      status: "success",
      message: "Test run updated.",
      runId,
    }
  } catch (error) {
    if (error instanceof RunMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Run data is invalid or references unavailable releases, environments, or assignees."
            : error.message,
      }
    }

    console.error("updateRunAction failed", error)
    return {
      status: "error",
      message: "Unable to update the test run right now.",
    }
  }
}

export { initialRunActionState }
