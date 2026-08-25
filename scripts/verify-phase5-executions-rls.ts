import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Role = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type CapabilityResult = "ALLOWED" | "DENIED"

type VerificationResult = {
  readExecutions: CapabilityResult
  readSteps: CapabilityResult
  readAttempts: CapabilityResult
  recordAssignedExecution: CapabilityResult
  recordRestrictedExecution: CapabilityResult
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
  const [planResult, releaseResult, leadResult, testerResult] =
    await Promise.all(
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
        () =>
          client
            .from("profiles")
            .select("id")
            .eq("email", "phase2.tester@localhost.com")
            .single(),
      ].map((operation) => withJwtRetry(operation))
    )

  for (const [label, result] of [
    ["plan", planResult],
    ["release", releaseResult],
    ["lead", leadResult],
    ["tester", testerResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const plan = planResult.data as PlanReferenceRow | null
  const release = releaseResult.data as ReleaseReferenceRow | null
  const lead = leadResult.data
  const tester = testerResult.data

  if (!plan || !release || !lead || !tester) {
    throw new Error("Required Phase 5 RLS references are missing")
  }

  return {
    planId: plan.id,
    applicationId: plan.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    leadProfileId: lead.id,
    testerProfileId: tester.id,
  }
}

async function createRun(
  client: SupabaseClient,
  name: string,
  assignmentProfileIds: string[],
  references: Awaited<ReturnType<typeof loadReferences>>
) {
  const { data, error } = await withJwtRetry(() =>
    client.rpc("create_test_run", {
      target_name: name,
      target_test_plan_id: references.planId,
      target_application_id: references.applicationId,
      target_release_id: references.releaseId,
      target_environment_id: references.environmentId,
      target_build: `${name.toLowerCase().replaceAll(/\s+/g, "-")}-build`,
      target_status: "NOT_STARTED",
      target_assignment_profile_ids: assignmentProfileIds,
    })
  )

  if (error || !data) {
    throw new Error(
      `Unable to create ${name}: ${error?.message ?? "No run id returned"}`
    )
  }

  return data as string
}

async function loadExecutionReference(client: SupabaseClient, runId: string) {
  const { data, error } = await withJwtRetry(() =>
    client
      .from("test_executions")
      .select("id,test_execution_steps(id)")
      .eq("test_run_id", runId)
      .order("scenario_title", { ascending: true })
      .limit(1)
      .single()
  )

  if (error || !data) {
    throw new Error(
      `Unable to load execution reference for run ${runId}: ${error?.message ?? "No execution"}`
    )
  }

  return {
    executionId: data.id as string,
    steps: (data.test_execution_steps as Array<{ id: string }>).map((step) => ({
      id: step.id,
      status: "PASS" as const,
      actual_result: null,
    })),
  }
}

async function canRead(
  client: SupabaseClient,
  table: "test_executions" | "test_execution_steps" | "test_execution_attempts"
) {
  const { error } = await withJwtRetry(() =>
    client.from(table).select("id").limit(1)
  )
  return error ? "DENIED" : "ALLOWED"
}

async function recordExecution(
  client: SupabaseClient,
  executionId: string,
  steps: Array<{ id: string; status: "PASS"; actual_result: null }>
) {
  const { error } = await withJwtRetry(() =>
    client.rpc("record_test_execution", {
      target_execution_id: executionId,
      target_status: "PASS",
      target_actual_result: "Verified successfully.",
      target_failure_reason: null,
      target_severity: null,
      target_bug_reference: null,
      target_steps: steps,
    })
  )

  return error ? "DENIED" : "ALLOWED"
}

async function setupRuns() {
  const leadClient = await signIn("QA_LEAD")

  try {
    const references = await loadReferences(leadClient)
    const assignedRunId = await createRun(
      leadClient,
      `Phase 5 RLS Assigned ${Date.now()}`,
      [references.testerProfileId],
      references
    )
    const restrictedRunId = await createRun(
      leadClient,
      `Phase 5 RLS Restricted ${Date.now()}`,
      [references.leadProfileId],
      references
    )

    return {
      assigned: await loadExecutionReference(leadClient, assignedRunId),
      restricted: await loadExecutionReference(leadClient, restrictedRunId),
    }
  } finally {
    await safeSignOut(leadClient)
  }
}

async function runFor(
  role: Role,
  executionRefs: Awaited<ReturnType<typeof setupRuns>>
) {
  const client = await signIn(role)

  try {
    return {
      readExecutions: await canRead(client, "test_executions"),
      readSteps: await canRead(client, "test_execution_steps"),
      readAttempts: await canRead(client, "test_execution_attempts"),
      recordAssignedExecution: await recordExecution(
        client,
        executionRefs.assigned.executionId,
        executionRefs.assigned.steps
      ),
      recordRestrictedExecution: await recordExecution(
        client,
        executionRefs.restricted.executionId,
        executionRefs.restricted.steps
      ),
    } satisfies VerificationResult
  } finally {
    await safeSignOut(client)
  }
}

async function main() {
  const executionRefs = await setupRuns()
  const roles: Role[] = ["ADMIN", "QA_LEAD", "QA_TESTER"]
  const matrix = {} as Record<Role, VerificationResult>

  for (const role of roles) {
    matrix[role] = await runFor(role, executionRefs)
  }

  console.log(JSON.stringify(matrix, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
