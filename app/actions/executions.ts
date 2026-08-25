"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import { executionSaveSchema } from "@/lib/execution-form-schema"
import { getCurrentProfile } from "@/services/auth"
import {
  ExecutionMutationError,
  saveExecutionRecord,
} from "@/services/executions"
import type { ExecutionSaveInput, ExecutionWorkspaceRun } from "@/types/qa"

export interface SaveExecutionActionResult {
  status: "success" | "error"
  message?: string
  run?: ExecutionWorkspaceRun
}

function getForbiddenResult(): SaveExecutionActionResult {
  return {
    status: "error",
    message: "You do not have permission to update this execution.",
  }
}

export async function saveExecutionAction(
  input: ExecutionSaveInput
): Promise<SaveExecutionActionResult> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local execution state only.",
    }
  }

  const profile = await getCurrentProfile()
  if (!profile) return getForbiddenResult()

  const parsed = executionSaveSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the execution details and try again.",
    }
  }

  try {
    const run = await saveExecutionRecord(parsed.data)
    revalidatePath("/runs")
    revalidatePath(`/runs/${parsed.data.runId}`)

    return {
      status: "success",
      message: "Execution saved.",
      run,
    }
  } catch (error) {
    if (error instanceof ExecutionMutationError) {
      return {
        status: "error",
        message:
          error.code === "VALIDATION"
            ? "Execution data is invalid or the selected steps are no longer available."
            : error.message,
      }
    }

    console.error("saveExecutionAction failed", error)
    return {
      status: "error",
      message: "Unable to save this execution right now.",
    }
  }
}
