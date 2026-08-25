import "server-only"

import { z } from "zod"

import {
  attachmentAllowedMimeTypes,
  attachmentMaxBytes,
} from "@/lib/attachment-path"
import { createClient } from "@/lib/supabase/server"
import { getRunExecutionWorkspace } from "@/services/executions"
import type { ExecutionWorkspaceRun } from "@/types/qa"

const EVIDENCE_BUCKET = "qa-evidence"

export class AttachmentMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION"
      | "PARTIAL_CLEANUP"
      | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
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

const registerAttachmentSchema = z.object({
  runId: z.uuid(),
  executionId: z.uuid(),
  storagePath: z.string().min(1),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(attachmentAllowedMimeTypes),
  sizeBytes: z.number().int().positive().max(attachmentMaxBytes),
})

function ensureExecutionAttachmentPath(
  executionId: string,
  storagePath: string
): string {
  const normalized = storagePath.trim()

  if (!normalized.startsWith(`${executionId}/`)) {
    throw new AttachmentMutationError(
      "Attachment path does not match the selected execution.",
      "VALIDATION"
    )
  }

  if (normalized.includes("..")) {
    throw new AttachmentMutationError(
      "Attachment path is invalid.",
      "VALIDATION"
    )
  }

  return normalized
}

async function loadLatestAttemptId(
  executionId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_execution_attempts")
    .select("id")
    .eq("execution_id", executionId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new AttachmentMutationError(
      `Unable to load execution attempt: ${error.message}`,
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  }

  return data?.id ?? null
}

export async function registerAttachmentRecord(
  input: RegisterAttachmentInput
): Promise<ExecutionWorkspaceRun> {
  const parsed = registerAttachmentSchema.safeParse(input)
  if (!parsed.success) {
    throw new AttachmentMutationError(
      z.prettifyError(parsed.error),
      "VALIDATION"
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AttachmentMutationError("Authentication required.", "FORBIDDEN")
  }

  try {
    const attemptId = await loadLatestAttemptId(parsed.data.executionId)
    const storagePath = ensureExecutionAttachmentPath(
      parsed.data.executionId,
      parsed.data.storagePath
    )
    const { error } = await supabase.from("attachments").insert({
      execution_id: parsed.data.executionId,
      attempt_id: attemptId,
      storage_path: storagePath,
      filename: parsed.data.filename,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      uploaded_by: user.id,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    await supabase.storage
      .from(EVIDENCE_BUCKET)
      .remove([parsed.data.storagePath])

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      throw new AttachmentMutationError(
        error.message,
        "code" in error && error.code === "42501" ? "FORBIDDEN" : "VALIDATION"
      )
    }

    throw new AttachmentMutationError(
      "Unable to register this attachment.",
      "UNKNOWN"
    )
  }

  const workspace = await getRunExecutionWorkspace(parsed.data.runId)
  if (!workspace) {
    throw new AttachmentMutationError("Run not found.", "NOT_FOUND")
  }

  return workspace
}

export async function deleteAttachmentRecord(
  input: DeleteAttachmentInput
): Promise<{ run: ExecutionWorkspaceRun; warning?: string }> {
  const supabase = await createClient()
  const { data: attachment, error: selectError } = await supabase
    .from("attachments")
    .select("id, storage_path")
    .eq("id", input.attachmentId)
    .maybeSingle<{ id: string; storage_path: string }>()

  if (selectError) {
    throw new AttachmentMutationError(
      `Unable to load attachment: ${selectError.message}`,
      selectError.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  }

  if (!attachment) {
    throw new AttachmentMutationError("Attachment not found.", "NOT_FOUND")
  }

  const { error: deleteMetadataError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", input.attachmentId)

  if (deleteMetadataError) {
    throw new AttachmentMutationError(
      `Unable to delete attachment metadata: ${deleteMetadataError.message}`,
      deleteMetadataError.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  }

  const { error: deleteStorageError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .remove([attachment.storage_path])

  const run = await getRunExecutionWorkspace(input.runId)
  if (!run) {
    throw new AttachmentMutationError("Run not found.", "NOT_FOUND")
  }

  if (deleteStorageError) {
    return {
      run,
      warning:
        "Attachment metadata was removed, but the storage object cleanup failed.",
    }
  }

  return { run }
}
