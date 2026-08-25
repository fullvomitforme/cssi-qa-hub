"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import { getCurrentProfile } from "@/services/auth"
import {
  createCommentRecord,
  createFeedbackRecord,
  FindingsMutationError,
} from "@/services/findings"
import type { ExecutionFeedbackItem, Severity } from "@/types/qa"

export interface FindingActionResult {
  status: "success" | "error"
  message?: string
}

function errorResult(error: unknown, fallback: string): FindingActionResult {
  if (error instanceof FindingsMutationError) {
    return {
      status: "error",
      message:
        error.code === "FORBIDDEN"
          ? "You do not have permission to change this finding."
          : error.code === "VALIDATION"
            ? "Check the finding details and try again."
            : error.message,
    }
  }
  console.error(fallback, error)
  return { status: "error", message: fallback }
}

export async function createFeedbackAction(input: {
  executionId: string
  scenarioId: string
  type: ExecutionFeedbackItem["type"]
  title: string
  description: string
  severity: Severity | null
}): Promise<FindingActionResult> {
  if (shouldUseDemoData())
    return { status: "error", message: "Demo mode uses local feedback state." }
  if (!(await getCurrentProfile()))
    return { status: "error", message: "You must be signed in." }
  try {
    await createFeedbackRecord(input)
    revalidatePath("/findings/feedback")
    revalidatePath("/runs")
    return { status: "success", message: "Feedback saved." }
  } catch (error) {
    return errorResult(error, "Unable to save feedback right now.")
  }
}

export async function createCommentAction(input: {
  subjectType: "EXECUTION" | "FAILURE" | "FEEDBACK" | "WORK_ITEM" | "REPORT"
  subjectId: string
  body: string
}): Promise<FindingActionResult> {
  if (shouldUseDemoData())
    return { status: "error", message: "Demo mode uses local comments." }
  if (!(await getCurrentProfile()))
    return { status: "error", message: "You must be signed in." }
  try {
    await createCommentRecord(input)
    revalidatePath("/findings/feedback")
    return { status: "success", message: "Comment added." }
  } catch (error) {
    return errorResult(error, "Unable to save comment right now.")
  }
}
