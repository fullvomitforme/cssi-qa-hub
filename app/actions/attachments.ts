"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import {
  AttachmentMutationError,
  deleteAttachmentRecord,
  registerAttachmentRecord,
} from "@/services/attachments"
import { getCurrentProfile } from "@/services/auth"
import type { ExecutionWorkspaceRun } from "@/types/qa"

export interface AttachmentActionResult {
  status: "success" | "error"
  message?: string
  warning?: string
  run?: ExecutionWorkspaceRun
}

type RegisterAttachmentInput = {
  runId: string
  executionId: string
  storagePath: string
  filename: string
  mimeType: string
  sizeBytes: number
}

type DeleteAttachmentInput = {
  runId: string
  attachmentId: string
}

function getForbiddenResult(): AttachmentActionResult {
  return {
    status: "error",
    message:
      "You do not have permission to manage evidence for this execution.",
  }
}

export async function registerAttachmentAction(
  input: RegisterAttachmentInput
): Promise<AttachmentActionResult> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local evidence only.",
    }
  }

  const profile = await getCurrentProfile()
  if (!profile) return getForbiddenResult()

  try {
    const run = await registerAttachmentRecord(input)
    revalidatePath(`/runs/${input.runId}`)
    revalidatePath("/runs")

    return {
      status: "success",
      message: "Evidence uploaded.",
      run,
    }
  } catch (error) {
    if (error instanceof AttachmentMutationError) {
      return {
        status: "error",
        message: error.message,
      }
    }

    console.error("registerAttachmentAction failed", error)
    return {
      status: "error",
      message: "Unable to register this attachment right now.",
    }
  }
}

export async function deleteAttachmentAction(
  input: DeleteAttachmentInput
): Promise<AttachmentActionResult> {
  if (shouldUseDemoData()) {
    return {
      status: "error",
      message: "Demo mode uses local evidence only.",
    }
  }

  const profile = await getCurrentProfile()
  if (!profile) return getForbiddenResult()

  try {
    const result = await deleteAttachmentRecord(input)
    revalidatePath(`/runs/${input.runId}`)
    revalidatePath("/runs")

    return {
      status: "success",
      message: result.warning
        ? "Evidence removed with a cleanup warning."
        : "Evidence removed.",
      warning: result.warning,
      run: result.run,
    }
  } catch (error) {
    if (error instanceof AttachmentMutationError) {
      return {
        status: "error",
        message: error.message,
      }
    }

    console.error("deleteAttachmentAction failed", error)
    return {
      status: "error",
      message: "Unable to remove this attachment right now.",
    }
  }
}
