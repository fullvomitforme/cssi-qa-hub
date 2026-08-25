import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Role = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type CapabilityResult = "ALLOWED" | "DENIED"

type VerificationResult = {
  uploadAccessibleExecution: CapabilityResult
  uploadRestrictedExecution: CapabilityResult
  readAccessibleEvidence: CapabilityResult
  readRestrictedEvidence: CapabilityResult
  deleteAccessibleEvidence: CapabilityResult
  deleteRestrictedEvidence: CapabilityResult
}

type PlanReferenceRow = {
  id: string
  application_id: string
  environment_id: string
}

type ReleaseReferenceRow = {
  id: string
  environment_id: string
}

const verificationRunId = "086dae28-ea44-4af2-b380-9c12a4617551"
const evidenceBucket = "qa-evidence"

const credentialMap: Record<Role, { email: string; password: string }> = {
  ADMIN: {
    email: "phase2.admin@localhost.com",
    password: "QaHubPhase2!Admin",
  },
  QA_LEAD: {
    email: "phase2.lead@localhost.com",
    password: "QaHubPhase2!Lead",
  },
  QA_TESTER: {
    email: "phase2.tester@localhost.com",
    password: "QaHubPhase2!Tester",
  },
}

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

async function signIn(role: Role) {
  const client = createBrowserlessClient()
  const { error } = await client.auth.signInWithPassword(credentialMap[role])

  if (error) {
    throw new Error(`${role} sign-in failed: ${error.message}`)
  }

  return client
}

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function loadReferences(client: SupabaseClient) {
  const [planResult, releaseResult, leadResult] = await Promise.all(
    [
      () =>
        client
          .from("test_plans")
          .select("id,application_id,environment_id")
          .eq("name", "Phase 3 Verification Plan Updated")
          .single<PlanReferenceRow>(),
      () =>
        client
          .from("releases")
          .select("id,environment_id")
          .eq("version", "v1.10.0")
          .eq("build", "phase3-verification")
          .single<ReleaseReferenceRow>(),
      () =>
        client
          .from("profiles")
          .select("id")
          .eq("email", "phase2.lead@localhost.com")
          .single(),
    ].map((operation) => withJwtRetry(operation))
  )

  for (const [label, result] of [
    ["plan", planResult],
    ["release", releaseResult],
    ["lead", leadResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const plan = planResult.data as PlanReferenceRow | null
  const release = releaseResult.data as ReleaseReferenceRow | null
  const lead = leadResult.data

  if (!plan || !release || !lead) {
    throw new Error("Required Phase 6 references are missing")
  }

  return {
    planId: plan.id,
    applicationId: plan.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    leadProfileId: lead.id as string,
  }
}

async function createLeadOnlyRun(
  client: SupabaseClient,
  references: Awaited<ReturnType<typeof loadReferences>>
) {
  const { data, error } = await withJwtRetry(() =>
    client.rpc("create_test_run", {
      target_name: `Phase 6 Restricted Evidence Run ${new Date().toISOString()}`,
      target_test_plan_id: references.planId,
      target_application_id: references.applicationId,
      target_release_id: references.releaseId,
      target_environment_id: references.environmentId,
      target_build: "phase6-evidence-rls",
      target_status: "NOT_STARTED",
      target_assignment_profile_ids: [references.leadProfileId],
    })
  )

  if (error || !data) {
    throw new Error(
      `Restricted run creation failed: ${error?.message ?? "No run id returned"}`
    )
  }

  return data as string
}

async function loadFirstExecutionId(client: SupabaseClient, runId: string) {
  const { data, error } = await withJwtRetry(() =>
    client
      .from("test_executions")
      .select("id")
      .eq("test_run_id", runId)
      .order("scenario_title", { ascending: true })
      .limit(1)
      .single()
  )

  if (error || !data) {
    throw new Error(
      `Unable to load execution for run ${runId}: ${error?.message ?? "No execution found"}`
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

async function createAttachment(
  client: SupabaseClient,
  executionId: string,
  fileName: string
) {
  const file = createPngFixture()
  const storagePath = `${executionId}/${crypto.randomUUID()}-${fileName}`

  const { error: uploadError } = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).upload(storagePath, file, {
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
    throw new Error("Authenticated session is missing")
  }

  const { data, error: insertError } = await withJwtRetry(() =>
    client
      .from("attachments")
      .insert({
        execution_id: executionId,
        storage_path: storagePath,
        filename: fileName,
        mime_type: "image/png",
        size_bytes: file.byteLength,
        uploaded_by: user.id,
      })
      .select("id")
      .single()
  )

  if (insertError || !data) {
    await client.storage.from(evidenceBucket).remove([storagePath])
    throw new Error(
      `Attachment insert failed: ${insertError?.message ?? "No attachment id returned"}`
    )
  }

  return {
    attachmentId: data.id as string,
    storagePath,
  }
}

async function cleanupAttachment(
  client: SupabaseClient,
  attachmentId: string,
  storagePath: string
) {
  await withJwtRetry(() =>
    client.from("attachments").delete().eq("id", attachmentId)
  )
  await withJwtRetry(() =>
    client.storage.from(evidenceBucket).remove([storagePath])
  )
}

async function canCreateAttachment(
  client: SupabaseClient,
  executionId: string,
  fileName: string
) {
  const file = createPngFixture()
  const storagePath = `${executionId}/${crypto.randomUUID()}-${fileName}`
  const uploadResult = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: false,
    })
  )

  if (uploadResult.error) {
    return {
      result: "DENIED" as const,
      storagePath,
    }
  }

  const {
    data: { user },
  } = await client.auth.getUser()

  const insertResult = await withJwtRetry(() =>
    client
      .from("attachments")
      .insert({
        execution_id: executionId,
        storage_path: storagePath,
        filename: fileName,
        mime_type: "image/png",
        size_bytes: file.byteLength,
        uploaded_by: user?.id,
      })
      .select("id")
      .single()
  )

  if (insertResult.error || !insertResult.data) {
    await client.storage.from(evidenceBucket).remove([storagePath])

    return {
      result: "DENIED" as const,
      storagePath,
    }
  }

  return {
    result: "ALLOWED" as const,
    storagePath,
    attachmentId: insertResult.data.id as string,
  }
}

async function canReadEvidence(client: SupabaseClient, storagePath: string) {
  const { data, error } = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).createSignedUrl(storagePath, 60)
  )

  return error || !data?.signedUrl ? "DENIED" : "ALLOWED"
}

async function canDeleteAttachment(
  client: SupabaseClient,
  attachmentId: string,
  storagePath: string
) {
  const metadataResult = await withJwtRetry(() =>
    client
      .from("attachments")
      .delete()
      .eq("id", attachmentId)
      .select("id")
      .maybeSingle()
  )

  if (metadataResult.error || !metadataResult.data) {
    return "DENIED" as const
  }

  const storageResult = await withJwtRetry(() =>
    client.storage.from(evidenceBucket).remove([storagePath])
  )

  if (storageResult.error) {
    throw new Error(
      `Storage cleanup failed after allowed metadata delete: ${storageResult.error.message}`
    )
  }

  return "ALLOWED" as const
}

async function verifyRole(
  role: Role,
  accessibleExecutionId: string,
  restrictedExecutionId: string,
  restrictedAttachment: { attachmentId: string; storagePath: string }
): Promise<VerificationResult> {
  const client = await signIn(role)

  try {
    const accessibleUpload = await canCreateAttachment(
      client,
      accessibleExecutionId,
      `phase6-${role.toLowerCase()}-accessible.png`
    )

    const restrictedUpload = await canCreateAttachment(
      client,
      restrictedExecutionId,
      `phase6-${role.toLowerCase()}-restricted.png`
    )

    const readAccessibleEvidence =
      accessibleUpload.result === "ALLOWED" && accessibleUpload.storagePath
        ? await canReadEvidence(client, accessibleUpload.storagePath)
        : "DENIED"

    const readRestrictedEvidence =
      restrictedUpload.result === "ALLOWED" && restrictedUpload.storagePath
        ? await canReadEvidence(client, restrictedUpload.storagePath)
        : await canReadEvidence(client, restrictedAttachment.storagePath)

    const deleteAccessibleEvidence =
      accessibleUpload.result === "ALLOWED" && accessibleUpload.attachmentId
        ? await canDeleteAttachment(
            client,
            accessibleUpload.attachmentId,
            accessibleUpload.storagePath
          )
        : "DENIED"

    const deleteRestrictedEvidence =
      restrictedUpload.result === "ALLOWED" && restrictedUpload.attachmentId
        ? await canDeleteAttachment(
            client,
            restrictedUpload.attachmentId,
            restrictedUpload.storagePath
          )
        : await canDeleteAttachment(
            client,
            restrictedAttachment.attachmentId,
            restrictedAttachment.storagePath
          )

    return {
      uploadAccessibleExecution: accessibleUpload.result,
      uploadRestrictedExecution: restrictedUpload.result,
      readAccessibleEvidence,
      readRestrictedEvidence,
      deleteAccessibleEvidence,
      deleteRestrictedEvidence,
    }
  } finally {
    await safeSignOut(client)
  }
}

async function main() {
  const leadClient = await signIn("QA_LEAD")

  try {
    const references = await loadReferences(leadClient)
    const restrictedRunId = await createLeadOnlyRun(leadClient, references)
    const accessibleExecutionId = await loadFirstExecutionId(
      leadClient,
      verificationRunId
    )
    const restrictedExecutionId = await loadFirstExecutionId(
      leadClient,
      restrictedRunId
    )

    const restrictedAttachment = await createAttachment(
      leadClient,
      restrictedExecutionId,
      "phase6-readable-restricted.png"
    )

    const results = {
      ADMIN: await verifyRole(
        "ADMIN",
        accessibleExecutionId,
        restrictedExecutionId,
        restrictedAttachment
      ),
      QA_LEAD: await verifyRole(
        "QA_LEAD",
        accessibleExecutionId,
        restrictedExecutionId,
        restrictedAttachment
      ),
      QA_TESTER: await verifyRole(
        "QA_TESTER",
        accessibleExecutionId,
        restrictedExecutionId,
        restrictedAttachment
      ),
    }

    const cleanupLead = await signIn("QA_LEAD")
    try {
      const restrictedStillExists = await withJwtRetry(() =>
        cleanupLead
          .from("attachments")
          .select("id")
          .eq("id", restrictedAttachment.attachmentId)
          .maybeSingle()
      )

      if (restrictedStillExists.data) {
        await cleanupAttachment(
          cleanupLead,
          restrictedAttachment.attachmentId,
          restrictedAttachment.storagePath
        )
      }
    } finally {
      await safeSignOut(cleanupLead)
    }

    console.log(
      JSON.stringify(
        {
          status: "ok",
          restrictedRunId,
          accessibleExecutionId,
          restrictedExecutionId,
          results,
        },
        null,
        2
      )
    )
  } finally {
    await safeSignOut(leadClient)
  }
}

await main()
