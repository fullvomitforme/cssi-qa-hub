import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const verificationRunId = "086dae28-ea44-4af2-b380-9c12a4617551"
const evidenceBucket = "qa-evidence"

function readEnvFile() {
  const raw = readFileSync(resolve(".env.local"), "utf8")
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=")
      return [line.slice(0, separator), line.slice(separator + 1)] as const
    })

  const env = Object.fromEntries(entries)
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC Supabase env values in .env.local")
  }

  return { url, key }
}

function createBrowserlessClient() {
  const { url, key } = readEnvFile()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function sleep(milliseconds: number) {
  await new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds)
  )
}

type MaybeErrorResult = {
  error?: {
    message?: string
  } | null
}

async function withJwtRetry<T>(
  operation: () => PromiseLike<T> | T,
  attempts = 5
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await Promise.resolve(operation())

      if (
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        (result as MaybeErrorResult).error?.message?.includes(
          "JWT issued at future"
        )
      ) {
        lastError = new Error(
          (result as MaybeErrorResult).error?.message ?? "JWT issued at future"
        )

        if (attempt === attempts - 1) {
          throw lastError
        }

        await sleep(1500)
        continue
      }

      return result
    } catch (error) {
      lastError = error
      if (
        !(error instanceof Error) ||
        !error.message.includes("JWT issued at future") ||
        attempt === attempts - 1
      ) {
        throw error
      }

      await sleep(1500)
    }
  }

  throw lastError
}

async function signInTester() {
  const client = createBrowserlessClient()
  const { error } = await client.auth.signInWithPassword({
    email: "phase2.tester@localhost.com",
    password: "QaHubPhase2!Tester",
  })

  if (error) {
    throw new Error(`QA_TESTER sign-in failed: ${error.message}`)
  }

  return client
}

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function loadExecutionReference(client: SupabaseClient) {
  const { data, error } = await withJwtRetry(() =>
    client
      .from("test_executions")
      .select("id")
      .eq("test_run_id", verificationRunId)
      .order("scenario_title", { ascending: true })
      .limit(1)
      .single()
  )

  if (error || !data) {
    throw new Error(
      `Unable to load verification execution: ${error?.message ?? "No execution found"}`
    )
  }

  return data.id as string
}

function createPngFixture() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pJv7n4AAAAASUVORK5CYII=",
    "base64"
  )
}

async function uploadAttachment(
  client: SupabaseClient,
  executionId: string,
  fileName: string
) {
  const storagePath = `${executionId}/${crypto.randomUUID()}-${fileName}`

  const { error: uploadError } = await withJwtRetry(() =>
    client.storage
      .from(evidenceBucket)
      .upload(storagePath, createPngFixture(), {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: false,
      })
  )

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    throw new Error("Authenticated tester session is missing")
  }

  const { data, error: insertError } = await withJwtRetry(() =>
    client
      .from("attachments")
      .insert({
        execution_id: executionId,
        storage_path: storagePath,
        filename: fileName,
        mime_type: "image/png",
        size_bytes: createPngFixture().byteLength,
        uploaded_by: user.id,
      })
      .select("id")
      .single()
  )

  if (insertError || !data) {
    await client.storage.from(evidenceBucket).remove([storagePath])
    throw new Error(
      `Attachment metadata insert failed: ${insertError?.message ?? "No attachment id returned"}`
    )
  }

  return {
    attachmentId: data.id as string,
    storagePath,
  }
}

async function verifyAttachmentExists(
  client: SupabaseClient,
  attachmentId: string
) {
  const { data, error } = await withJwtRetry(() =>
    client.from("attachments").select("id").eq("id", attachmentId).maybeSingle()
  )

  if (error) {
    throw new Error(`Attachment read failed: ${error.message}`)
  }

  if (!data) {
    throw new Error("Attachment metadata was not persisted")
  }
}

async function verifySignedPreview(
  client: SupabaseClient,
  storagePath: string
) {
  const { data, error } = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).createSignedUrl(storagePath, 60)
  )

  if (error || !data?.signedUrl) {
    throw new Error(
      `Signed preview failed: ${error?.message ?? "No signed URL returned"}`
    )
  }
}

async function deleteAttachment(
  client: SupabaseClient,
  attachmentId: string,
  storagePath: string
) {
  const { error: metadataError } = await withJwtRetry(() =>
    client.from("attachments").delete().eq("id", attachmentId)
  )

  if (metadataError) {
    throw new Error(`Metadata delete failed: ${metadataError.message}`)
  }

  const { error: storageError } = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).remove([storagePath])
  )

  if (storageError) {
    throw new Error(`Storage delete failed: ${storageError.message}`)
  }
}

async function verifyAttachmentRemoved(
  client: SupabaseClient,
  attachmentId: string
) {
  const { data, error } = await withJwtRetry(() =>
    client.from("attachments").select("id").eq("id", attachmentId).maybeSingle()
  )

  if (error) {
    throw new Error(`Attachment post-delete read failed: ${error.message}`)
  }

  if (data) {
    throw new Error("Attachment metadata still exists after delete")
  }
}

async function main() {
  const testerClient = await signInTester()

  try {
    const executionId = await loadExecutionReference(testerClient)
    const uploaded = await uploadAttachment(
      testerClient,
      executionId,
      "phase6-workflow-proof.png"
    )

    await verifyAttachmentExists(testerClient, uploaded.attachmentId)
    await verifySignedPreview(testerClient, uploaded.storagePath)
    await deleteAttachment(
      testerClient,
      uploaded.attachmentId,
      uploaded.storagePath
    )
    await verifyAttachmentRemoved(testerClient, uploaded.attachmentId)

    console.log(
      JSON.stringify(
        {
          status: "ok",
          runId: verificationRunId,
          executionId,
          attachmentId: uploaded.attachmentId,
          storagePath: uploaded.storagePath,
        },
        null,
        2
      )
    )
  } finally {
    await safeSignOut(testerClient)
  }
}

await main()
